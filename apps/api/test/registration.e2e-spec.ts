import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { PrismaModule } from '../src/database/prisma.module.js';
import { requireTestDatabaseUrl } from './setup-database.js';
import { createHash } from 'node:crypto';
import { ResendEmailService } from '../src/integrations/resend/resend-email.service.js';
import { VerificationToken } from '../src/modules/auth/verification-token.js';
import { configureApp } from '../src/common/configure-app.js';

vi.hoisted(() => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Radar Local <hello@example.com>';
  process.env.WEB_URL = 'https://web.example';
  process.env.CORS_ORIGIN = 'https://web.example';
});

describe('public registration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: VerificationToken;
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
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (prisma) {
      requireTestDatabaseUrl(process.env.DATABASE_URL);
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    }
    await app?.close();
  });
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
