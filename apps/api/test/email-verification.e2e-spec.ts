import { createHash, randomUUID } from 'node:crypto';
import {
  setImmediate as nextTurn,
  setTimeout as delay,
} from 'node:timers/promises';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { ResendEmailService } from '../src/integrations/resend/resend-email.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { SearchEmailEligibilityService } from '../src/modules/auth/search-email-eligibility.service.js';
import { requireTestDatabaseUrl } from './setup-database.js';

vi.mock('node:timers/promises', { spy: true });

vi.hoisted(() => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Radar Local <hello@example.com>';
  process.env.WEB_URL = 'https://web.example';
  process.env.CORS_ORIGIN = 'https://web.example';
});

describe('email verification', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let email: string;
  const send = vi.fn<(to: string, link: string) => Promise<void>>();

  beforeAll(async () => {
    requireTestDatabaseUrl(process.env.DATABASE_URL);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ResendEmailService)
      .useValue({ sendVerificationEmail: send })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = module.get(PrismaService);
  });

  beforeEach(() => {
    email = `verify-${randomUUID()}@example.com`;
    send.mockReset();
    send.mockResolvedValue(undefined);
    vi.mocked(delay).mockReset().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma?.emailVerification.deleteMany({ where: { email } });
    await prisma?.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await app?.close();
  });

  async function registerAndReadLink() {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana', email, password: 'same password' })
      .expect(201);
    expect(send).toHaveBeenCalledExactlyOnceWith(email, expect.any(String));
    const link = new URL(send.mock.calls[0]![1]);
    expect(link.pathname).toBe('/confirmar-email');
    const token = link.searchParams.get('token');
    expect(token).toBeTruthy();
    return token;
  }

  it('confirms the email, consumes the link, preserves the demo and returns no session', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const confirmedAt = new Date('2026-11-10T23:59:59.999Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    const token = await registerAndReadLink();
    const demoUsedAt = new Date('2026-11-09T00:00:00.000Z');
    const user = await prisma.user.update({
      where: { email },
      data: { demoUsedAt },
    });
    const verification = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(user.emailVerifiedAt).toBeNull();
    expect(verification.usedAt).toBeNull();

    clock.mockReturnValue(confirmedAt.getTime());
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200, { data: { status: 'confirmed' } });

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers.authorization).toBeUndefined();
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ).toEqual({
      ...user,
      emailVerifiedAt: confirmedAt,
    });
    expect(
      await prisma.emailVerification.findUniqueOrThrow({
        where: { id: verification.id },
      }),
    ).toEqual({ ...verification, usedAt: confirmedAt });
  });

  it.each([
    ['missing', {}],
    ['malformed', { token: 'not-a-verification-token' }],
    ['unknown', { token: 'A'.repeat(43) }],
  ])('rejects the %s token as invalid without changing the account or link', async (_case, body) => {
    const { user, verification } = await registerAndReadState();

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send(body)
      .expect(400, {
        statusCode: 400,
        code: 'VERIFICATION_LINK_INVALID',
        message: 'O link de confirmação é inválido.',
      });

    await expectUnchangedState(user, verification);
  });

  it('rejects a token issued for a different email address as invalid', async () => {
    const { token, user, verification } = await registerAndReadState();
    const currentUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: 'verify-' + randomUUID() + '@example.com' },
    });

    try {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(400, {
          statusCode: 400,
          code: 'VERIFICATION_LINK_INVALID',
          message: 'O link de confirmação é inválido.',
        });

      await expectUnchangedState(currentUser, verification);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { email } });
    }
  });

  it('rejects a link as expired at exactly 24 hours without changing the account or link', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const expiresAt = new Date('2026-11-11T00:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    const { token, user, verification } = await registerAndReadState();
    expect(verification.expiresAt).toEqual(expiresAt);

    clock.mockReturnValue(expiresAt.getTime());
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(410, {
        statusCode: 410,
        code: 'VERIFICATION_LINK_EXPIRED',
        message: 'O link de confirmação expirou.',
      });

    await expectUnchangedState(user, verification);
  });

  it('blocks a pending email before continuing a search and allows the confirmed account to continue', async () => {
    const { token, user, verification } = await registerAndReadState();
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.demoUsedAt).toBeNull();

    const eligibility = app.get(SearchEmailEligibilityService);
    const evaluateRemainingConditions = vi.fn();
    const attemptSearch = async () => {
      await eligibility.assertEmailVerified(user.id);
      evaluateRemainingConditions();
    };

    await expect(attemptSearch()).rejects.toMatchObject({
      publicError: { code: 'EMAIL_VERIFICATION_REQUIRED' },
    });
    expect(evaluateRemainingConditions).not.toHaveBeenCalled();
    await expectUnchangedState(user, verification);

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200, { data: { status: 'confirmed' } });

    await attemptSearch();
    expect(evaluateRemainingConditions).toHaveBeenCalledTimes(1);
    const confirmedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(confirmedUser.demoUsedAt).toBeNull();
  });

  it('documents invalid and expired link errors in OpenAPI', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(body.paths['/auth/verify-email'].post.responses).toMatchObject({
      400: {
        content: {
          'application/json': {
            schema: {
              properties: {
                code: { enum: expect.arrayContaining(['VERIFICATION_LINK_INVALID']) },
              },
            },
          },
        },
      },
      410: {
        content: {
          'application/json': {
            schema: {
              properties: {
                code: { enum: ['VERIFICATION_LINK_EXPIRED'] },
              },
            },
          },
        },
      },
    });
  });

  it('recovers a lost confirmation response with the same link after its original expiration', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const confirmedAt = new Date('2026-11-10T12:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    const { token, user, verification } = await registerAndReadState();

    clock.mockReturnValue(confirmedAt.getTime());
    await request(app.getHttpServer()).post('/auth/verify-email').send({ token });
    const confirmedUser = { ...user, emailVerifiedAt: confirmedAt };
    const usedVerification = { ...verification, usedAt: confirmedAt };
    await expectUnchangedState(confirmedUser, usedVerification);

    clock.mockReturnValue(verification.expiresAt.getTime() + 1);
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200, { data: { status: 'already-confirmed' } });

    await expectUnchangedState(confirmedUser, usedVerification);
  });

  it('confirms a link only once when two requests use it concurrently', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const confirmedAt = new Date('2026-11-10T12:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    const { token, user, verification } = await registerAndReadState();

    clock.mockReturnValue(confirmedAt.getTime());
    const verifyLink = () =>
      request(app.getHttpServer()).post('/auth/verify-email').send({ token });
    const responses = await Promise.all([
      verifyLink().expect(200),
      verifyLink().expect(200),
    ]);

    expect(responses.map(({ body }) => body)).toEqual(
      expect.arrayContaining([
        { data: { status: 'confirmed' } },
        { data: { status: 'already-confirmed' } },
      ]),
    );

    clock.mockReturnValue(confirmedAt.getTime() + 1);
    const previousConfirmation = { data: { status: 'already-confirmed' } };
    await Promise.all([
      verifyLink().expect(200, previousConfirmation),
      verifyLink().expect(200, previousConfirmation),
    ]);
    await expectUnchangedState(
      { ...user, emailVerifiedAt: confirmedAt },
      { ...verification, usedAt: confirmedAt },
    );
  });

  it('rejects a used link when it no longer matches the current email address', async () => {
    const { token, user, verification } = await registerAndReadState();
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200, { data: { status: 'confirmed' } });
    const usedVerification = await prisma.emailVerification.findUniqueOrThrow({
      where: { id: verification.id },
    });
    const currentUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: 'verify-' + randomUUID() + '@example.com' },
    });

    try {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(400, {
          statusCode: 400,
          code: 'VERIFICATION_LINK_INVALID',
          message: 'O link de confirmação é inválido.',
        });

      await expectUnchangedState(currentUser, usedVerification);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { email } });
    }
  });

  it('documents both confirmation statuses in OpenAPI', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(
      body.components.schemas.EmailVerificationResult.properties.status.enum,
    ).toEqual(['confirmed', 'already-confirmed']);
  });

  const resendResponseWindowMs = 16_000;
  const resendResult = { data: { retryAfterSeconds: 60 } };

  function requestResend(address = email) {
    return request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: address });
  }

  it.each(['an expired link', 'an unconfirmed registration send'])(
    'issues a different 24-hour link for the pending account after %s',
    async (entryPoint) => {
      const initialIssue = new Date('2026-11-10T00:00:00.000Z');
      const clock = vi
        .spyOn(Date, 'now')
        .mockReturnValue(initialIssue.getTime());
      if (entryPoint === 'an expired link') {
        const token = await registerAndReadLink();
        clock.mockReturnValue(initialIssue.getTime() + 24 * 60 * 60 * 1000);
        await request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token })
          .expect(410);
      } else {
        send.mockRejectedValueOnce(new Error('Initial send not accepted'));
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ name: 'Ana', email, password: 'same password' })
          .expect(502);
        clock.mockReturnValue(initialIssue.getTime() + 60 * 1000);
      }

      const pending = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(pending.emailVerifiedAt).toBeNull();
      const resendExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await requestResend('  ' + email.toUpperCase() + '  ').expect(
        202,
        resendResult,
      );
      expect(send).toHaveBeenCalledTimes(2);

      expect(delay).toHaveBeenCalledExactlyOnceWith(resendResponseWindowMs);

      const [recipient, newLink] = send.mock.calls[1]!;
      expect(recipient).toBe(email);
      expect(newLink).not.toBe(send.mock.calls[0]![1]);
      const link = new URL(newLink);
      expect(link.pathname).toBe('/confirmar-email');
      const token = link.searchParams.get('token')!;
      expect(token).toBeTruthy();
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const newVerification = await prisma.emailVerification.findUniqueOrThrow({
        where: { tokenHash },
      });
      expect(newVerification).toMatchObject({
        userId: pending.id,
        email,
        expiresAt: resendExpiry,
        usedAt: null,
      });

      const confirmedAt = new Date(resendExpiry.getTime() - 1);
      clock.mockReturnValue(confirmedAt.getTime());
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(200, { data: { status: 'confirmed' } });

      await expectUnchangedState(
        { ...pending, emailVerifiedAt: confirmedAt },
        { ...newVerification, usedAt: confirmedAt },
      );
    },
  );

  it('returns the generic response without sending to missing or already confirmed accounts', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    const { token, user } = await registerAndReadState();
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200);
    clock.mockReturnValue(issuedAt.getTime() + 61_000);
    send.mockClear();

    await Promise.all([
      requestResend().expect(202, resendResult),
      requestResend('missing-' + randomUUID() + '@example.com').expect(
        202,
        resendResult,
      ),
    ]);

    expect(delay).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenNthCalledWith(1, resendResponseWindowMs);
    expect(delay).toHaveBeenNthCalledWith(2, resendResponseWindowMs);
    expect(send).not.toHaveBeenCalled();
    expect(
      await prisma.emailVerification.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  it('issues one new link for concurrent requests outside the resend interval', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    const { user } = await registerAndReadState();
    clock.mockReturnValue(issuedAt.getTime() + 61_000);
    send.mockClear();

    await Promise.all([
      requestResend().expect(202, resendResult),
      requestResend().expect(202, resendResult),
    ]);

    expect(send).toHaveBeenCalledExactlyOnceWith(email, expect.any(String));
    expect(
      await prisma.emailVerification.count({ where: { userId: user.id } }),
    ).toBe(2);
  });

  function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((finish) => {
      resolve = finish;
    });
    return { promise, resolve };
  }

  it.each([
    ['rejects the send', new Error('Provider rejected the send'), 0],
    ['times out', new DOMException('Provider timed out', 'AbortError'), 10_000],
  ])('keeps confirmation pending and allows resend when the provider %s', async (_case, error, providerDelayMs) => {
    const issuedAt = Date.parse('2026-11-10T00:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt);
    const { user, verification } = await registerAndReadState();
    const failedResendAt = issuedAt + 60_000;
    clock.mockReturnValue(failedResendAt);

    const sendStarted = deferred();
    const windowElapsed = deferred();
    vi.mocked(delay).mockReturnValueOnce(windowElapsed.promise);
    send.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
      setTimeout(() => reject(error), providerDelayMs);
      sendStarted.resolve();
    }));

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const firstResend = requestResend().expect(202, resendResult).then(
      (response) => response,
    );
    try {
      await sendStarted.promise;
      await vi.advanceTimersByTimeAsync(providerDelayMs);
      const responded = await Promise.race([
        firstResend.then(() => true),
        nextTurn().then(() => false),
      ]);
      expect(responded).toBe(false);
      expect(delay).toHaveBeenCalledExactlyOnceWith(resendResponseWindowMs);
    } finally {
      vi.useRealTimers();
      windowElapsed.resolve();
      await firstResend;
    }

    await expectUnchangedState(user, verification);
    expect(
      await prisma.emailVerification.count({ where: { userId: user.id } }),
    ).toBe(2);

    clock.mockReturnValue(failedResendAt + 59_999);
    await requestResend().expect(202, resendResult);
    expect(send).toHaveBeenCalledTimes(2);
    expect(
      await prisma.emailVerification.count({ where: { userId: user.id } }),
    ).toBe(2);

    const retriedAt = failedResendAt + 60_000;
    clock.mockReturnValue(retriedAt);
    await requestResend().expect(202, resendResult);
    expect(delay).toHaveBeenCalledTimes(3);
    expect(delay).toHaveBeenNthCalledWith(2, resendResponseWindowMs);
    expect(delay).toHaveBeenNthCalledWith(3, resendResponseWindowMs);
    expect(send).toHaveBeenCalledTimes(3);
    const [recipient, deliveredLink] = send.mock.calls[2]!;
    expect(recipient).toBe(email);
    expect(deliveredLink).not.toBe(send.mock.calls[1]![1]);
    await expectUnchangedState(user, verification);

    const token = new URL(deliveredLink).searchParams.get('token');
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200, { data: { status: 'confirmed' } });
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ).toEqual({ ...user, emailVerifiedAt: new Date(retriedAt) });
  });

  it('waits for the resend to finish even if the public window has elapsed', async () => {
    const issuedAt = new Date('2026-11-10T00:00:00.000Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(issuedAt.getTime());
    await registerAndReadLink();
    clock.mockReturnValue(issuedAt.getTime() + 61_000);

    const sendStarted = deferred();
    const sendFinished = deferred();
    const windowElapsed = deferred();
    vi.mocked(delay).mockReturnValueOnce(windowElapsed.promise);
    send.mockImplementationOnce(() => {
      sendStarted.resolve();
      return sendFinished.promise;
    });

    const resend = app.get(AuthService).resendVerification(email);
    try {
      await sendStarted.promise;
      windowElapsed.resolve();
      const responded = await Promise.race([
        resend.then(() => true),
        nextTurn().then(() => false),
      ]);
      expect(responded).toBe(false);
    } finally {
      windowElapsed.resolve();
      sendFinished.resolve();
      await resend;
    }
    await expect(resend).resolves.toEqual(resendResult.data);
  });

  async function registerAndReadState() {
    const token = await registerAndReadLink();
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const verification = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: user.id },
    });
    return { token, user, verification };
  }

  async function expectUnchangedState(
    user: Awaited<ReturnType<typeof registerAndReadState>>['user'],
    verification: Awaited<ReturnType<typeof registerAndReadState>>['verification'],
  ) {
    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
      .toEqual(user);
    expect(await prisma.emailVerification.findUniqueOrThrow({ where: { id: verification.id } }))
      .toEqual(verification);
  }

  it('rolls back both updates if the database refuses to mark the link as used', async () => {
    email = 'verify-rollback@example.com';
    const token = await registerAndReadLink();
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const verification = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: user.id },
    });

    await prisma.$executeRaw`
      ALTER TABLE email_verifications ADD CONSTRAINT reject_verification_use
      CHECK ("usedAt" IS NULL OR email <> 'verify-rollback@example.com') NOT VALID
    `;
    try {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(500, {
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor.',
        });
    } finally {
      await prisma.$executeRaw`
        ALTER TABLE email_verifications DROP CONSTRAINT reject_verification_use
      `;
    }

    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ).toEqual(user);
    expect(
      await prisma.emailVerification.findUniqueOrThrow({
        where: { id: verification.id },
      }),
    ).toEqual(verification);
  });
});
