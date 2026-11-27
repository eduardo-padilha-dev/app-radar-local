import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Req,
  type INestApplication,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { scrypt } from 'node:crypto';
import request from 'supertest';
import type { Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { ResendEmailService } from '../src/integrations/resend/resend-email.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { Role } from '../generated/prisma/enums.js';
import {
  RequireRole,
  type AuthenticatedRequest,
} from '../src/modules/auth/auth-session.guard.js';
import { AuthSessionService } from '../src/modules/auth/auth-session.service.js';
import { AuthModule } from '../src/modules/auth/auth.module.js';
import { PasswordHasher } from '../src/modules/auth/password-hasher.js';
import { SearchEmailEligibilityService } from '../src/modules/auth/search-email-eligibility.service.js';
import { requireTestDatabaseUrl } from './setup-database.js';

vi.mock(import('node:crypto'), { spy: true });

vi.hoisted(() => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Radar Local <hello@example.com>';
  process.env.WEB_URL = 'https://web.example';
  process.env.CORS_ORIGIN = 'https://web.example';
});

const prospectingResults = new Map<string, { userId: string; name: string }>();

@Controller('test/private')
class PrivateResourcesController {
  constructor(
    @Inject(SearchEmailEligibilityService)
    private readonly searchEmailEligibility: SearchEmailEligibilityService,
  ) {}

  @Get('developer')
  @RequireRole(Role.DEVELOPER)
  developer() {
    return { area: 'developer' };
  }

  @Get('admin')
  @RequireRole(Role.ADMIN)
  admin() {
    return { area: 'admin' };
  }

  @Get('search-email-eligibility')
  @RequireRole(Role.DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async assertSearchEmailEligibility(@Req() req: AuthenticatedRequest) {
    await this.searchEmailEligibility.assertEmailVerified(
      req.authenticatedUser.id,
    );
  }

  @Get('prospecting/:id')
  @RequireRole(Role.DEVELOPER)
  prospecting(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const result = prospectingResults.get(id);
    if (!result || result.userId !== req.authenticatedUser.id) {
      throw new NotFoundException();
    }
    return { name: result.name };
  }
}

const defaultProtectedHandler = vi.fn(() => ({ area: 'default-protected' }));

@Controller('test/default-protected')
class DefaultProtectedController {
  @Get()
  get() {
    return defaultProtectedHandler();
  }
}

const origin = 'https://web.example';
const password = 'original password';
const developerEmail = 'session-dev@example.com';
const adminEmail = 'session-admin@example.com';
const otherDeveloperEmail = 'session-other-dev@example.com';
const inactiveEmail = 'session-inactive@example.com';
const pendingEmail = 'session-pending@example.com';
const fixtureEmails = [
  developerEmail,
  adminEmail,
  otherDeveloperEmail,
  inactiveEmail,
  pendingEmail,
];

describe('account sessions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    requireTestDatabaseUrl(process.env.DATABASE_URL);
    const module = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [PrivateResourcesController, DefaultProtectedController],
    })
      .overrideProvider(ResendEmailService)
      .useValue({ sendVerificationEmail: vi.fn() })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    const passwordHash = await app.get(PasswordHasher).hash(password);
    await prisma.user.createMany({
      data: [
        {
          name: 'Ana',
          email: developerEmail,
          passwordHash,
          role: 'DEVELOPER',
          emailVerifiedAt: new Date(),
        },
        {
          name: 'Bia',
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          emailVerifiedAt: new Date(),
        },
        {
          name: 'Cris',
          email: otherDeveloperEmail,
          passwordHash,
          role: 'DEVELOPER',
          emailVerifiedAt: new Date(),
        },
        {
          name: 'Dani',
          email: inactiveEmail,
          passwordHash,
          role: 'DEVELOPER',
          isActive: false,
          emailVerifiedAt: new Date(),
        },
        {
          name: 'Eli',
          email: pendingEmail,
          passwordHash,
          role: 'DEVELOPER',
        },
      ],
    });
    const developer = await prisma.user.findUniqueOrThrow({
      where: { email: developerEmail },
    });
    prospectingResults.set('fixture', {
      userId: developer.id,
      name: 'Estabelecimento de teste',
    });
  });

  afterAll(async () => {
    try {
      requireTestDatabaseUrl(process.env.DATABASE_URL);
      await prisma?.user.deleteMany({
        where: { email: { in: fixtureEmails } },
      });
    } finally {
      await app?.close();
    }
  });

  function login(email: string, submittedPassword = password) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email, password: submittedPassword });
  }

  it.each([
    {
      email: developerEmail,
      input: '  SESSION-DEV@example.com ',
      role: 'DEVELOPER',
    },
    { email: adminEmail, input: adminEmail, role: 'ADMIN' },
  ])(
    'logs in a persisted $role and reads their private session',
    async ({ email, input, role }) => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      const profile = { id: user.id, name: user.name, role };
      const response = await login(input).expect(200).expect({ data: profile });
      const cookie = sessionCookie(response);
      await request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', cookie)
        .expect(200)
        .expect({ data: profile });
    },
  );

  it.each([
    {
      scenario: 'unknown email',
      email: 'session-unknown@example.com',
      submittedPassword: password,
    },
    {
      scenario: 'wrong password',
      email: developerEmail,
      submittedPassword: 'wrong password',
    },
    {
      scenario: 'inactive account',
      email: inactiveEmail,
      submittedPassword: password,
    },
  ])(
    'uses the same denial and password derivation for $scenario',
    async ({ email, submittedPassword }) => {
      const sessionCount = await prisma.authSession.count();
      vi.mocked(scrypt).mockClear();

      const response = await login(email, submittedPassword)
        .expect(401)
        .expect({
          statusCode: 401,
          code: 'HTTP_ERROR',
          message: 'Não foi possível concluir a solicitação.',
        });

      expect(response.headers['set-cookie']).toBeUndefined();
      expect(await prisma.authSession.count()).toBe(sessionCount);
      expect(scrypt).toHaveBeenCalledExactlyOnceWith(
        submittedPassword,
        expect.any(Buffer),
        64,
        { N: 16384, r: 8, p: 1, maxmem: 67108864 },
        expect.any(Function),
      );
    },
  );

  function privateResource(path: string, cookie: string) {
    return request(app.getHttpServer())
      .get('/test/private/' + path)
      .set('Cookie', cookie);
  }

  function defaultProtectedResource(cookie?: string) {
    const resource = request(app.getHttpServer()).get('/test/default-protected');
    if (cookie) resource.set('Cookie', cookie);
    return resource;
  }

  async function expectDefaultProtectedDenial(cookie?: string) {
    defaultProtectedHandler.mockClear();
    await defaultProtectedResource(cookie).expect(401);
    expect(defaultProtectedHandler).not.toHaveBeenCalled();
  }

  it('requires a session by default without reaching the handler', async () => {
    await expectDefaultProtectedDenial();
  });

  it('refuses a fixture cookie with an altered signature by default', async () => {
    const cookie = sessionCookie(await login(developerEmail).expect(200));
    const [header, payload] = cookie.split('.');
    await expectDefaultProtectedDenial([header, payload, 'invalid'].join('.'));
  });

  it('allows a valid session and refuses the same cookie after logout by default', async () => {
    const cookie = sessionCookie(await login(developerEmail).expect(200));
    defaultProtectedHandler.mockClear();
    await defaultProtectedResource(cookie)
      .expect(200)
      .expect({ data: { area: 'default-protected' } });
    expect(defaultProtectedHandler).toHaveBeenCalledOnce();

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .expect(204);
    await expectDefaultProtectedDenial(cookie);
  });

  it('keeps a fixed eight-hour session and refuses the old cookie at the exact deadline', async () => {
    const signedInAt = new Date('2026-11-26T13:00:00.437Z').getTime();
    const expiresAt = signedInAt + 8 * 60 * 60 * 1000;
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(signedInAt);
      const response = await login(developerEmail).expect(200);
      const [cookie, ...attributes] = sessionCookieHeader(response).split('; ');
      expect(cookie).toMatch(/^radar_session=/);
      const token = cookie.slice('radar_session='.length);
      const { sid, exp } = app
        .get(JwtService)
        .decode<{ sid: string; exp: number }>(token);
      const cookieExpiry = new Date(Math.ceil(expiresAt / 1000) * 1000);
      expect(attributes.sort()).toEqual([
        `Expires=${cookieExpiry.toUTCString()}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        'Secure',
      ]);
      expect(exp).toBe(expiresAt / 1000);
      expect(
        await prisma.authSession.findUniqueOrThrow({ where: { id: sid } }),
      ).toMatchObject({ expiresAt: new Date(expiresAt) });

      vi.setSystemTime(signedInAt + 4 * 60 * 60 * 1000);
      const activity = await privateResource('developer', cookie).expect(200);
      expect(activity.headers['set-cookie']).toBeUndefined();
      expect(
        await prisma.authSession.findUniqueOrThrow({ where: { id: sid } }),
      ).toMatchObject({ expiresAt: new Date(expiresAt) });

      vi.setSystemTime(expiresAt - 1);
      await privateResource('developer', cookie).expect(200);
      vi.setSystemTime(expiresAt);
      await privateResource('developer', cookie).expect(401);
      await request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', cookie)
        .expect(401);

      await expectDefaultProtectedDenial(cookie);

      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Origin', origin)
        .set('Cookie', cookie)
        .expect(204)
        .expect('Cache-Control', 'no-store')
        .expect('');
      expectClearedSessionCookie(logout);
    } finally {
      vi.useRealTimers();
    }
  });

  it('signs out only the current device and expires its session cookie', async () => {
    const firstCookie = sessionCookie(await login(developerEmail).expect(200));
    const secondCookie = sessionCookie(await login(developerEmail).expect(200));
    expect(firstCookie).not.toBe(secondCookie);

    await privateResource('developer', firstCookie).expect(200);
    await privateResource('developer', secondCookie).expect(200);

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', origin)
      .set('Cookie', firstCookie)
      .expect(204)
      .expect('Cache-Control', 'no-store')
      .expect('');
    expectClearedSessionCookie(logout);

    await privateResource('developer', firstCookie).expect(401);
    await privateResource('developer', secondCookie).expect(200);
  });

  it('expires the cookie on logout retry after the first response is lost', async () => {
    const cookie = sessionCookie(await login(developerEmail).expect(200));
    await privateResource('developer', cookie).expect(200);

    // Keep the original cookie to simulate a browser that missed Set-Cookie.
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .expect(204);
    await privateResource('developer', cookie).expect(401);

    const retry = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .expect(204)
      .expect('Cache-Control', 'no-store')
      .expect('');
    expectClearedSessionCookie(retry);
    await privateResource('developer', cookie).expect(401);
  });

  it('revokes both device sessions permanently when the account is deactivated', async () => {
    const { id } = await prisma.user.findUniqueOrThrow({
      where: { email: developerEmail },
      select: { id: true },
    });
    const firstCookie = sessionCookie(await login(developerEmail).expect(200));
    const secondCookie = sessionCookie(await login(developerEmail).expect(200));
    const otherAccountCookie = sessionCookie(
      await login(otherDeveloperEmail).expect(200),
    );

    expect(firstCookie).not.toBe(secondCookie);
    await privateResource('developer', firstCookie).expect(200);
    await privateResource('developer', secondCookie).expect(200);

    try {
      await app.get(AuthSessionService).deactivateAccount(id);
      await privateResource('developer', firstCookie).expect(401);
      await privateResource('developer', secondCookie).expect(401);
      await privateResource('developer', otherAccountCookie).expect(200);
    } finally {
      await prisma.user.update({ where: { id }, data: { isActive: true } });
    }

    await privateResource('developer', firstCookie).expect(401);
    await privateResource('developer', secondCookie).expect(401);
    const newCookie = sessionCookie(await login(developerEmail).expect(200));
    await privateResource('developer', newCookie).expect(200);
  });

  it('refuses an in-flight login when deactivation commits before session creation', async () => {
    const { id } = await prisma.user.findUniqueOrThrow({
      where: { email: developerEmail },
      select: { id: true },
    });
    const where = { userId: id };
    const sessionCount = await prisma.authSession.count({ where });
    const passwordVerified = deferred<boolean>();
    const resumeLogin = deferred<void>();
    const passwordHasher = app.get(PasswordHasher);
    const verifyPassword = passwordHasher.verify.bind(passwordHasher);
    const pauseAfterVerification = vi
      .spyOn(passwordHasher, 'verify')
      .mockImplementationOnce(async (password, hash) => {
        const matches = await verifyPassword(password, hash);
        passwordVerified.resolve(matches);
        await resumeLogin.promise;
        return matches;
      });
    const pendingLogin = login(developerEmail).then();

    try {
      const passwordMatches = await Promise.race([
        passwordVerified.promise,
        pendingLogin.then(() => {
          throw new Error(
            'Login completed before password verification paused',
          );
        }),
      ]);
      expect(passwordMatches).toBe(true);

      await app.get(AuthSessionService).deactivateAccount(id);
      resumeLogin.resolve();
      const response = await pendingLogin;

      expect(response.status).toBe(401);
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(await prisma.authSession.count({ where })).toBe(sessionCount);
    } finally {
      resumeLogin.resolve();
      pauseAfterVerification.mockRestore();
      try {
        await pendingLogin;
      } finally {
        await prisma.user.update({ where: { id }, data: { isActive: true } });
      }
    }
  });

  it('revokes the session from a login that holds the account lock during deactivation', async () => {
    const { id } = await prisma.user.findUniqueOrThrow({
      where: { email: developerEmail },
      select: { id: true },
    });
    const sessionCreationReached = deferred<void>();
    const resumeLogin = deferred<void>();
    const loginBackendPid = deferred<number>();
    const deactivationBackendPid = deferred<number>();
    const prismaWithPausedSessionCreation = prisma.$extends({
      query: {
        authSession: {
          async create({ args, query }) {
            sessionCreationReached.resolve();
            await resumeLogin.promise;
            return query(args);
          },
        },
      },
    });
    // Capture both methods before installing the spy inherited by the extended client.
    const runLoginTransaction =
      prismaWithPausedSessionCreation.$transaction.bind(
        prismaWithPausedSessionCreation,
      );
    const runDeactivationTransaction = prisma.$transaction.bind(prisma);
    const observeTransactions = vi
      .spyOn(prisma, '$transaction')
      .mockImplementationOnce((operation, options) =>
        runLoginTransaction(async (tx) => {
          // The query extension preserves the transaction client's operations.
          const transaction = tx as unknown as Prisma.TransactionClient;
          loginBackendPid.resolve(await backendPid(transaction));
          return operation(transaction);
        }, options),
      )
      .mockImplementationOnce((operation, options) =>
        runDeactivationTransaction(async (tx) => {
          deactivationBackendPid.resolve(await backendPid(tx));
          return operation(tx);
        }, options),
      );
    const pendingLogin = login(developerEmail).expect(200).then();
    let pendingDeactivation: Promise<void> | undefined;

    try {
      const [loginPid] = await Promise.race([
        Promise.all([loginBackendPid.promise, sessionCreationReached.promise]),
        pendingLogin.then(() => {
          throw new Error('Login completed before session creation paused');
        }),
      ]);

      let deactivationFinished = false;
      pendingDeactivation = app
        .get(AuthSessionService)
        .deactivateAccount(id)
        .finally(() => {
          deactivationFinished = true;
        });
      const deactivationWasBlocked = await Promise.race([
        vi.waitFor(async () => {
          if (deactivationFinished) return false;
          const deactivationPid = await deactivationBackendPid.promise;
          const [{ blocked }] = await prisma.$queryRaw<[{ blocked: boolean }]>`
            SELECT ${loginPid}::int = ANY(pg_blocking_pids(${deactivationPid}::int))
              AS blocked
          `;
          expect(blocked).toBe(true);
          return true;
        }),
        pendingDeactivation.then(() => false),
      ]);

      resumeLogin.resolve();
      const [response] = await Promise.all([pendingLogin, pendingDeactivation]);
      const cookie = sessionCookie(response);
      await privateResource('developer', cookie).expect(401);

      await prisma.user.update({ where: { id }, data: { isActive: true } });
      await privateResource('developer', cookie).expect(401);
      expect(deactivationWasBlocked).toBe(true);
    } finally {
      resumeLogin.resolve();
      observeTransactions.mockRestore();
      await Promise.allSettled([pendingLogin, pendingDeactivation]);
      await prisma.user.update({ where: { id }, data: { isActive: true } });
    }
  });

  it('rejects logout requests from other origins without changing the session', async () => {
    const cookie = sessionCookie(await login(developerEmail).expect(200));
    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', 'https://other.example')
      .set('Cookie', cookie)
      .expect(403);
    expect(logout.headers['set-cookie']).toBeUndefined();

    await privateResource('developer', cookie).expect(200);
  });

  it('rejects logout requests from other origins even without a cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', 'https://other.example')
      .expect(403);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it.each([undefined, 'radar_session=invalid'])(
    'expires the cookie even when there is no usable session (%s)',
    async (cookie) => {
      const logout = request(app.getHttpServer())
        .post('/auth/logout')
        .set('Origin', origin);
      if (cookie) logout.set('Cookie', cookie);

      const response = await logout
        .expect(204)
        .expect('Cache-Control', 'no-store')
        .expect('');
      expectClearedSessionCookie(response);
    },
  );

  it.each([
    { email: developerEmail, allowed: 'developer', denied: 'admin' },
    { email: adminEmail, allowed: 'admin', denied: 'developer' },
  ])(
    'limits $allowed functions to the current profile',
    async ({ email, allowed, denied }) => {
      const cookie = sessionCookie(await login(email).expect(200));
      await privateResource(allowed, cookie)
        .expect(200)
        .expect({ data: { area: allowed } });
      await privateResource(denied, cookie).expect(403);
    },
  );

  it('allows a pending developer into their private area and requires email verification before search', async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: pendingEmail },
    });
    expect(user.demoUsedAt).toBeNull();

    const cookie = sessionCookie(await login(pendingEmail).expect(200));
    await privateResource('developer', cookie)
      .expect(200)
      .expect({ data: { area: 'developer' } });
    await privateResource('search-email-eligibility', cookie)
      .expect(403)
      .expect({
        statusCode: 403,
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Confirme seu e-mail para fazer buscas.',
      });

    const pendingUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { demoUsedAt: true },
    });
    expect(pendingUser.demoUsedAt).toBeNull();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
    await privateResource('search-email-eligibility', cookie).expect(204);
  });

  it('allows only the authenticated developer who owns the prospecting result', async () => {
    const cookie = sessionCookie(await login(developerEmail).expect(200));
    const adminCookie = sessionCookie(await login(adminEmail).expect(200));
    const otherDeveloperCookie = sessionCookie(
      await login(otherDeveloperEmail).expect(200),
    );
    await privateResource('prospecting/fixture', cookie)
      .expect(200)
      .expect({ data: { name: 'Estabelecimento de teste' } });
    await privateResource('prospecting/fixture', adminCookie).expect(403);
    await privateResource('prospecting/fixture', otherDeveloperCookie).expect(
      404,
    );
  });

  it('uses the current role on the account for an existing session', async () => {
    const cookie = sessionCookie(await login(developerEmail).expect(200));
    await prisma.user.update({
      where: { email: developerEmail },
      data: { role: Role.ADMIN },
    });
    try {
      await privateResource('developer', cookie).expect(403);
      await privateResource('admin', cookie).expect(200);
    } finally {
      await prisma.user.update({
        where: { email: developerEmail },
        data: { role: Role.DEVELOPER },
      });
    }
  });

  it('rejects login requests from other origins without setting a session cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'https://other.example')
      .send({ email: developerEmail, password })
      .expect(403);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('allows credentialed requests from the configured origin', async () => {
    await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204)
      .expect('Access-Control-Allow-Origin', origin)
      .expect('Access-Control-Allow-Credentials', 'true');
  });

  it('requires a session to read the private profile', async () => {
    await request(app.getHttpServer()).get('/auth/session').expect(401);
  });
});

async function backendPid(tx: Prisma.TransactionClient) {
  const [{ pid }] = await tx.$queryRaw<[{ pid: number }]>`
    SELECT pg_backend_pid() AS pid
  `;
  return pid;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function sessionCookie(response: Response) {
  return sessionCookieHeader(response).split(';', 1)[0];
}

function sessionCookieHeader(response: Response) {
  const cookies: unknown = response.headers['set-cookie'];
  if (
    !Array.isArray(cookies) ||
    cookies.length !== 1 ||
    typeof cookies[0] !== 'string'
  ) {
    throw new Error('Expected one session cookie');
  }
  return cookies[0];
}

function expectClearedSessionCookie(response: Response) {
  const [cookie, ...attributes] = sessionCookieHeader(response).split('; ');
  expect(cookie).toBe('radar_session=');
  expect(attributes.sort()).toEqual([
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Secure',
  ]);
}
