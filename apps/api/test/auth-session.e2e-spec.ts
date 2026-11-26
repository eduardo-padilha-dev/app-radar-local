import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { scrypt } from 'node:crypto';
import request from 'supertest';
import type { Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { ResendEmailService } from '../src/integrations/resend/resend-email.service.js';
import { Role } from '../generated/prisma/enums.js';
import {
  AuthSessionGuard,
  RequireRole,
  type AuthenticatedRequest,
} from '../src/modules/auth/auth-session.guard.js';
import { AuthModule } from '../src/modules/auth/auth.module.js';
import { PasswordHasher } from '../src/modules/auth/password-hasher.js';
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
@UseGuards(AuthSessionGuard)
class PrivateResourcesController {
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

const origin = 'https://web.example';
const password = 'original password';
const developerEmail = 'session-dev@example.com';
const adminEmail = 'session-admin@example.com';
const otherDeveloperEmail = 'session-other-dev@example.com';
const inactiveEmail = 'session-inactive@example.com';
const fixtureEmails = [
  developerEmail,
  adminEmail,
  otherDeveloperEmail,
  inactiveEmail,
];

describe('account sessions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    requireTestDatabaseUrl(process.env.DATABASE_URL);
    const module = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [PrivateResourcesController],
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

function sessionCookie(response: Response) {
  const cookies: unknown = response.headers['set-cookie'];
  if (
    !Array.isArray(cookies) ||
    cookies.length !== 1 ||
    typeof cookies[0] !== 'string'
  ) {
    throw new Error('Expected one session cookie');
  }
  return cookies[0].split(';', 1)[0];
}
