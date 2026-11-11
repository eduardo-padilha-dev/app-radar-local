import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from './resend-email.service.js';

afterEach(() => vi.unstubAllGlobals());
it('sends the verification link through the provider REST API without exposing credentials in the message', async () => {
  const send = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: 'message-id' }), { status: 200 }),
    );
  vi.stubGlobal('fetch', send);
  const config = new ConfigService({
    RESEND_API_KEY: 'test-key',
    EMAIL_FROM: 'Radar Local <hello@example.com>',
  });
  const service = new ResendEmailService(config);
  await service.sendVerificationEmail(
    'ana@example.com',
    'https://web.example/confirmar-email?token=original-token',
  );
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0]?.[0]).toBe('https://api.resend.com/emails');
  const options = send.mock.calls[0]?.[1] as RequestInit;
  expect(options.method).toBe('POST');
  expect(options.headers).toEqual({
    Authorization: 'Bearer test-key',
    'Content-Type': 'application/json',
  });
  expect(JSON.parse(options.body as string)).toEqual({
    from: 'Radar Local <hello@example.com>',
    to: ['ana@example.com'],
    subject: 'Confirme seu cadastro no Radar Local',
    text: 'Confirme seu cadastro: https://web.example/confirmar-email?token=original-token',
  });
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
