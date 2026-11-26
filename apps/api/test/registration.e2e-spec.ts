import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { PrismaModule } from '../src/database/prisma.module.js';
import { requireTestDatabaseUrl } from './setup-database.js';
import { createHash, scryptSync } from 'node:crypto';
import { ResendEmailService } from '../src/integrations/resend/resend-email.service.js';
import { VerificationToken } from '../src/modules/auth/verification-token.js';
import { VerificationEmailUnconfirmedException } from '../src/modules/auth/verification-email-unconfirmed.exception.js';
import { configureApp } from '../src/common/configure-app.js';

vi.hoisted(() => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Radar Local <hello@example.com>';
  process.env.WEB_URL = 'https://web.example';
  process.env.CORS_ORIGIN = 'https://web.example';
});

it('provides the public registration error without the provider cause', () => {
  const error = new VerificationEmailUnconfirmedException(
    new Error('Sensitive provider details'),
  );
  expect(error.getResponse()).toEqual({
    code: 'VERIFICATION_EMAIL_UNCONFIRMED',
    message:
      'Sua conta foi criada, mas não conseguimos confirmar o envio do e-mail de confirmação. Tente reenviar o link.',
    details: { accountCreated: true, emailVerificationPending: true },
  });
});

describe('public registration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: VerificationToken;
  let provider: ResendEmailService;
  const send = vi.fn<(to: string, link: string) => Promise<void>>();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    })
      .overrideProvider(ResendEmailService)
      .useValue({ sendVerificationEmail: send })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = module.get(PrismaService);
    tokens = module.get(VerificationToken);
    provider = new ResendEmailService(module.get(ConfigService));
  });
  beforeEach(async () => {
    requireTestDatabaseUrl(process.env.DATABASE_URL);
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
    send.mockReset();
    send.mockImplementation(async (to, link) => {
      // The provider must only be called after both records have committed.
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: to },
      });
      const token = new URL(link).searchParams.get('token')!;
      expect(
        await prisma.emailVerification.findMany({ where: { userId: user.id } }),
      ).toEqual([
        expect.objectContaining({
          tokenHash: createHash('sha256').update(token).digest('hex'),
        }),
      ]);
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  afterAll(async () => {
    if (prisma) {
      requireTestDatabaseUrl(process.env.DATABASE_URL);
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    }
    await app?.close();
  });
  it('sanitizes the response body of a generic bad gateway exception', async () => {
    vi.spyOn(tokens, 'issue').mockImplementationOnce(() => {
      throw new BadGatewayException({
        code: 'PROVIDER_ERROR',
        message: 'Sensitive provider details',
        details: { sensitive: true },
      });
    });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@example.com', password: 'same password' })
      .expect(502)
      .expect({
        statusCode: 502,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor.',
      });
  });
  it.each(['HTTP rejection', 'network failure', 'timeout'])(
    'keeps one active account and unused token on provider %s',
    async (failure) => {
      const fetchMock = vi.fn<typeof fetch>();
      if (failure === 'HTTP rejection') {
        fetchMock.mockResolvedValueOnce(new Response('Sensitive provider details', { status: 403 }));
      } else {
        fetchMock.mockRejectedValueOnce(
          failure === 'timeout'
            ? new DOMException('Sensitive provider details', 'TimeoutError')
            : new TypeError('Sensitive provider details'),
        );
      }
      vi.stubGlobal('fetch', fetchMock);
      send.mockImplementationOnce((to, link) => provider.sendVerificationEmail(to, link));
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Ana', email: 'ana@example.com', password: 'same password' });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        statusCode: 502,
        code: 'VERIFICATION_EMAIL_UNCONFIRMED',
        message:
          'Sua conta foi criada, mas não conseguimos confirmar o envio do e-mail de confirmação. Tente reenviar o link.',
        details: { accountCreated: true, emailVerificationPending: true },
      });
      expect(send).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const users = await prisma.user.findMany();
      expect(users).toEqual([
        expect.objectContaining({ email: 'ana@example.com', isActive: true, emailVerifiedAt: null }),
      ]);
      const token = new URL(send.mock.calls[0]![1]).searchParams.get('token')!;
      expect(await prisma.emailVerification.findMany()).toEqual([
        expect.objectContaining({
          userId: users[0]!.id,
          email: 'ana@example.com',
          tokenHash: createHash('sha256').update(token).digest('hex'),
          usedAt: null,
        }),
      ]);
    },
  );
  it('creates an active developer awaiting email confirmation without a session or paid access', async () => {
    const now = new Date('2026-11-10T15:30:00.123Z');
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'same password',
      });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { accountCreated: true, verificationEmailStatus: 'accepted' },
    });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers.authorization).toBeUndefined();
    expect(await prisma.user.findMany()).toEqual([
      expect.objectContaining({
        name: 'Ana',
        email: 'ana@example.com',
        role: 'DEVELOPER',
        isActive: true,
        emailVerifiedAt: null,
        demoUsedAt: null,
        accessExpiresAt: null,
      }),
    ]);
    expect(send).toHaveBeenCalledTimes(1);
    const [to, link] = send.mock.calls[0]!;
    expect(to).toBe('ana@example.com');
    const url = new URL(link);
    expect(`${url.origin}${url.pathname}`).toBe(
      'https://web.example/confirmar-email',
    );
    const originalToken = url.searchParams.get('token')!;
    expect(originalToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await prisma.emailVerification.findMany()).toEqual([
      expect.objectContaining({
        email: 'ana@example.com',
        tokenHash: createHash('sha256').update(originalToken).digest('hex'),
        expiresAt: new Date('2026-11-11T15:30:00.123Z'),
        usedAt: null,
      }),
    ]);
    expect(JSON.stringify(response.body)).not.toContain(originalToken);
    expect(JSON.stringify(response.body)).not.toContain('same password');
    const first = await prisma.user.findUniqueOrThrow({ where: { email: to } });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Bia',
        email: 'bia@example.com',
        password: 'same password',
      })
      .expect(201);
    const second = await prisma.user.findUniqueOrThrow({
      where: { email: 'bia@example.com' },
    });
    expect(first.passwordHash).not.toBe(second.passwordHash);
    expect(first.passwordHash).not.toContain('same password');
  });

  it.each([
    { label: 'omitted', input: {}, expected: null },
    { label: 'empty', input: { phone: '' }, expected: null },
    {
      label: 'national',
      input: { phone: '42912345678' },
      expected: '42912345678',
    },
    {
      label: 'formatted with +55',
      input: { phone: '+55 (42) 91234-5678' },
      expected: '42912345678',
    },
  ])(
    'creates an account with a phone that is $label',
    async ({ input, expected }) => {
      const email = 'ana@example.com';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Ana', email, password: 'same password', ...input })
        .expect(201);

      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(user.phone).toBe(expected);
      expect(send).toHaveBeenCalledTimes(1);
    },
  );

  const validRegistration = {
    name: 'Ana',
    email: 'ana@example.com',
    password: 'same password',
  };

  it.each([
    { field: 'role', value: 'ADMIN' },
    { field: 'isActive', value: false },
    { field: 'emailVerifiedAt', value: '2026-11-10T15:30:00.000Z' },
    { field: 'demoUsedAt', value: '2026-11-10T15:30:00.000Z' },
    { field: 'accessExpiresAt', value: '2027-11-10T15:30:00.000Z' },
    { field: 'unknownProperty', value: 'unexpected' },
  ])(
    'rejects the extra field $field without creating an account or sending email',
    async ({ field, value }) => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegistration, [field]: value })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
      expect(await prisma.user.count()).toBe(0);
      expect(await prisma.emailVerification.count()).toBe(0);
      expect(send).not.toHaveBeenCalled();
    },
  );

  const emailConflict = {
    statusCode: 409,
    code: 'EMAIL_ALREADY_REGISTERED',
    message:
      'Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.',
  };

  it.each(['ANA@EXAMPLE.COM', '  ana@example.com  ', ' Ana@EXAMPLE.COM '])(
    'rejects duplicate email %j and preserves the original account and token',
    async (email) => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegistration, phone: '42912345678' })
        .expect(201);
      const original = await prisma.user.findUniqueOrThrow({
        where: { email: validRegistration.email },
      });
      const originalTokens = await prisma.emailVerification.findMany({
        where: { userId: original.id },
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Bia', email, password: 'another password' })
        .expect(409, emailConflict);

      expect(await prisma.user.findMany()).toEqual([original]);
      expect(await prisma.emailVerification.findMany()).toEqual(originalTokens);
      expect(send).toHaveBeenCalledTimes(1);
    },
  );

  it('preserves the first registration when an identical request follows a discarded response', async () => {
    // Complete the first request and discard its response instead of reading the result.
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(validRegistration)
      .expect(201);
    const original = await prisma.user.findUniqueOrThrow({
      where: { email: validRegistration.email },
    });
    const originalVerification = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: original.id },
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(validRegistration)
      .expect(409, emailConflict);

    expect(await prisma.user.findMany()).toEqual([original]);
    expect(await prisma.emailVerification.findMany()).toEqual([originalVerification]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('creates one account and returns one conflict for concurrent requests', async () => {
    const responses = await Promise.all(
      [validRegistration.email, ' Ana@EXAMPLE.COM '].map((email) =>
        request(app.getHttpServer())
          .post('/auth/register')
          .send({ ...validRegistration, email }),
      ),
    );

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    expect(responses.find(({ status }) => status === 409)?.body).toEqual(
      emailConflict,
    );
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.emailVerification.count()).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('keeps email addresses distinct when they differ by dots or plus tags', async () => {
    const emails = [
      'ana@example.com',
      'a.na@example.com',
      'ana+tag@example.com',
    ];
    for (const email of emails) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegistration, email })
        .expect(201);
    }

    const users = await prisma.user.findMany({ select: { email: true } });
    expect(users.map(({ email }) => email).sort()).toEqual([...emails].sort());
    expect(await prisma.emailVerification.count()).toBe(3);
    expect(send).toHaveBeenCalledTimes(3);
  });

  const nameRule = 'Informe um nome de 2 a 100 caracteres.';
  const emailRule = 'Informe um e-mail válido.';
  const passwordRule = 'Informe uma senha de 8 a 128 caracteres.';
  const phoneRule =
    'Informe um celular brasileiro com 11 dígitos nacionais, incluindo o DDD, e 9 depois do DDD.';

  it.each([
    {
      label: 'missing required fields',
      input: { phone: '' },
      details: {
        name: [nameRule],
        email: [emailRule],
        password: [passwordRule],
      },
    },
    {
      label: 'invalid types',
      input: {
        name: 13,
        email: false,
        password: ['same password'],
        phone: { number: '42912345678' },
      },
      details: {
        name: [nameRule],
        email: [emailRule],
        password: [passwordRule],
        phone: [phoneRule],
      },
    },
    {
      label: 'empty required fields',
      input: { name: ' ', email: ' ', password: '' },
      details: {
        name: [nameRule],
        email: [emailRule],
        password: [passwordRule],
      },
    },
    {
      label: 'null phone',
      input: { ...validRegistration, phone: null },
      details: { phone: [phoneRule] },
    },
    {
      label: 'name below minimum after trimming',
      input: { ...validRegistration, name: ' A ' },
      details: { name: [nameRule] },
    },
    {
      label: 'name above maximum',
      input: { ...validRegistration, name: 'A'.repeat(101) },
      details: { name: [nameRule] },
    },
    {
      label: 'password below minimum',
      input: { ...validRegistration, password: 'seven!!' },
      details: { password: [passwordRule] },
    },
    {
      label: 'password above maximum',
      input: { ...validRegistration, password: 'a'.repeat(129) },
      details: { password: [passwordRule] },
    },
    {
      label: 'invalid email',
      input: { ...validRegistration, email: 'ana.example.com' },
      details: { email: [emailRule] },
    },
    ...[
      '91234-5678',
      '4291234567',
      '429123456789',
      '(42) 81234-5678',
      '+54 (42) 91234-5678',
      '55 (42) 91234-5678',
      '(42) 91234-5678a',
      '(42) 91234.5678',
      '()-',
      '+55',
    ].map((phone) => ({
      label: `invalid phone ${phone}`,
      input: { ...validRegistration, phone },
      details: { phone: [phoneRule] },
    })),
  ])(
    'reports $label by field without creating an account or sending email',
    async ({ input, details }) => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(input);

      expect(response.body).toEqual({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Verifique os campos informados.',
        details,
      });
      expect(response.status).toBe(400);
      expect(await prisma.user.count()).toBe(0);
      expect(await prisma.emailVerification.count()).toBe(0);
      expect(send).not.toHaveBeenCalled();
    },
  );

  it.each([
    { label: 'minimum', name: 'Al', password: ' secret ' },
    { label: 'maximum', name: 'A'.repeat(100), password: ' '.repeat(128) },
  ])(
    'accepts the $label limits and normalizes name and email while preserving password spaces',
    async ({ name, password }) => {
      const email = 'ana.silva+teste@example.com';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: ` ${name} `,
          email: ' Ana.Silva+Teste@EXAMPLE.COM ',
          password,
        })
        .expect(201);

      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(user.name).toBe(name);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith(email, expect.any(String));
      const [, , , , , , salt, hash] = user.passwordHash.split('$');
      const expectedHash = scryptSync(
        password,
        Buffer.from(salt!, 'base64url'),
        64,
      );
      expect(hash).toBe(expectedHash.toString('base64url'));
    },
  );

  it('rolls back both records and never sends email when token persistence fails', async () => {
    const original = await prisma.user.create({
      data: {
        name: 'Existing',
        email: 'existing@example.com',
        passwordHash: 'original-hash',
      },
    });
    const verification = await prisma.emailVerification.create({
      data: {
        userId: original.id,
        email: original.email,
        tokenHash: 'collision',
        expiresAt: new Date('2026-11-11T00:00:00Z'),
      },
    });
    vi.spyOn(tokens, 'issue').mockReturnValue({
      token: 'not-sent',
      tokenHash: 'collision',
      expiresAt: new Date('2026-11-11T00:00:00Z'),
    });
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'same password',
      });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    });
    expect(await prisma.user.findMany()).toEqual([original]);
    expect(await prisma.emailVerification.findMany()).toEqual([verification]);
    expect(send).not.toHaveBeenCalled();
  });
});
