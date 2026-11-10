import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../src/database/prisma.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { requireTestDatabaseUrl } from './setup-database.js';

describe('registration database safety', () => {
  it.each([
    'postgresql://app:app@127.0.0.1:5433/appdb',
    'postgresql://app:app@localhost:5433/appdb?schema=public',
    'postgresql://app:app@db:5432/appdb',
  ])('rejects the development database before connecting: %s', (url) => {
    expect(() => requireTestDatabaseUrl(url)).toThrow();
  });

  it('requires an explicit test database URL', () => {
    expect(() => requireTestDatabaseUrl(undefined)).toThrow();
    expect(() => requireTestDatabaseUrl('')).toThrow();
  });

  it('accepts an explicitly separate test database', () => {
    const url = 'postgresql://app:app@127.0.0.1:5433/appdb_test';
    expect(requireTestDatabaseUrl(url)).toBe(url);
  });
});

describe('registration persistence', () => {
  let module: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
    await module.init();
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    requireTestDatabaseUrl(process.env.DATABASE_URL);
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    if (prisma) {
      requireTestDatabaseUrl(process.env.DATABASE_URL);
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    }
    await module?.close();
  });

  it('commits the active developer and pending verification together', async () => {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: 'Ana',
          email: 'ana@example.com',
          passwordHash: 'stored-password-hash',
        },
      });
      await tx.emailVerification.create({
        data: {
          userId: created.id,
          email: created.email,
          tokenHash: 'stored-token-hash',
          expiresAt: new Date('2026-11-11T12:00:00Z'),
        },
      });
      return created;
    });

    expect(
      await prisma.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({
      name: 'Ana',
      email: 'ana@example.com',
      role: 'DEVELOPER',
      isActive: true,
      phone: null,
      emailVerifiedAt: null,
      demoUsedAt: null,
      accessExpiresAt: null,
    });
    expect(await prisma.emailVerification.findMany()).toEqual([
      expect.objectContaining({
        userId: user.id,
        email: 'ana@example.com',
        tokenHash: 'stored-token-hash',
        expiresAt: new Date('2026-11-11T12:00:00Z'),
        usedAt: null,
      }),
    ]);
  });

  it('rejects a duplicate email without changing the existing account', async () => {
    const original = await prisma.user.create({
      data: {
        name: 'Ana',
        email: 'ana@example.com',
        passwordHash: 'original-hash',
      },
    });
    await expect(
      prisma.user.create({
        data: {
          name: 'Other',
          email: 'ana@example.com',
          passwordHash: 'other-hash',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.user.findMany()).toEqual([original]);
  });

  it('rolls back the new user when token issuance violates uniqueness', async () => {
    const original = await prisma.user.create({
      data: {
        name: 'Ana',
        email: 'ana@example.com',
        passwordHash: 'original-hash',
      },
    });
    const verification = await prisma.emailVerification.create({
      data: {
        userId: original.id,
        email: original.email,
        tokenHash: 'existing-token-hash',
        expiresAt: new Date('2026-11-11T12:00:00Z'),
      },
    });

    await expect(
      prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: 'Bia',
            email: 'bia@example.com',
            passwordHash: 'other-hash',
          },
        });
        await tx.emailVerification.create({
          data: {
            userId: user.id,
            email: user.email,
            tokenHash: 'existing-token-hash',
            expiresAt: new Date('2026-11-11T12:00:00Z'),
          },
        });
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    expect(await prisma.user.findMany()).toEqual([original]);
    expect(await prisma.emailVerification.findMany()).toEqual([verification]);
  });
});
