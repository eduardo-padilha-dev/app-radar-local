import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from '../src/common/configure-app.js';
import { validateEnvironment } from '../src/config/environment.js';
import { ResendEmailService } from '../src/integrations/resend/resend-email.service.js';

vi.hoisted(() => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Radar Local <hello@example.com>';
  process.env.WEB_URL = 'https://web.example';
  process.env.CORS_ORIGIN = 'https://web.example';
});

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResendEmailService)
      .useValue({ sendVerificationEmail: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ data: 'Hello World!' });
  });

  it('serves the live OpenAPI contract for the public registration endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const operation = response.body.paths['/auth/register'].post;
    expect(operation.requestBody.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/RegisterDto',
    });
    expect(
      operation.responses['201'].content['application/json'].schema.properties
        .data.properties,
    ).toMatchObject({
      accountCreated: { enum: [true] },
      verificationEmailStatus: { enum: ['accepted'] },
    });
    expect(operation.security).toBeUndefined();
    await request(app.getHttpServer()).get('/docs/').expect(200);
  });

  it('documents the registration email conflict in the live OpenAPI contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const conflict =
      response.body.paths['/auth/register'].post.responses['409'];
    expect(conflict).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['statusCode', 'code', 'message'],
            properties: {
              statusCode: { type: 'integer', enum: [409] },
              code: { type: 'string', enum: ['EMAIL_ALREADY_REGISTERED'] },
              message: { type: 'string' },
            },
          },
        },
      },
    });
  });

  it('documents the unconfirmed verification email response', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const operation = response.body.paths['/auth/register'].post;
    expect(operation.responses['502']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: expect.arrayContaining(['statusCode', 'code', 'message', 'details']),
            properties: {
              statusCode: { type: 'integer', enum: [502] },
              code: { type: 'string', enum: ['VERIFICATION_EMAIL_UNCONFIRMED'] },
              message: { type: 'string' },
              details: {
                type: 'object',
                required: expect.arrayContaining(['accountCreated', 'emailVerificationPending']),
                properties: {
                  accountCreated: { type: 'boolean', enum: [true] },
                  emailVerificationPending: { type: 'boolean', enum: [true] },
                },
              },
            },
          },
        },
      },
    });
  });

  it('uses the configured web origin for CORS', async () => {
    await request(app.getHttpServer())
      .options('/auth/register')
      .set('Origin', 'https://web.example')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'https://web.example');
  });

  it('documents the registration validation response and optional field errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const operation = response.body.paths['/auth/register'].post;
    expect(operation.responses['400']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: expect.arrayContaining(['statusCode', 'code', 'message']),
            properties: {
              statusCode: { type: 'integer', enum: [400] },
              code: { type: 'string', enum: ['VALIDATION_ERROR'] },
              message: { type: 'string' },
              details: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      },
    });
    expect(
      operation.responses['400'].content['application/json'].schema.required,
    ).not.toContain('details');
  });

  it('applies DTO validation globally and exposes a safe error contract', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: {}, email: 'ana@example.com', password: 'password' })
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Verifique os campos informados.',
        details: { name: ['Informe um nome de 2 a 100 caracteres.'] },
      });
    await request(app.getHttpServer())
      .get('/missing')
      .expect(404)
      .expect({
        statusCode: 404,
        code: 'HTTP_ERROR',
        message: 'Não foi possível concluir a solicitação.',
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('required environment', () => {
  const valid = {
    DATABASE_URL: 'postgresql://app:app@localhost/appdb_test',
    RESEND_API_KEY: 'test-key',
    EMAIL_FROM: 'hello@example.com',
    WEB_URL: 'https://web.example',
    CORS_ORIGIN: 'https://web.example',
  };
  it.each(Object.keys(valid))('rejects missing %s at startup', (key) => {
    expect(() => validateEnvironment({ ...valid, [key]: '' })).toThrow(
      `${key} is required`,
    );
  });
  it('accepts the required configuration and rejects incompatible URLs', () => {
    expect(validateEnvironment(valid)).toEqual(valid);
    expect(() =>
      validateEnvironment({ ...valid, WEB_URL: 'ftp://web.example' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({ ...valid, DATABASE_URL: 'https://db.example' }),
    ).toThrow();
  });
});
