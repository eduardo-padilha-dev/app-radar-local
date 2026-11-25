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

it('cancels a single pending request after exactly ten seconds', async () => {
  vi.useFakeTimers();
  try {
    const send = vi.fn<typeof fetch>(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = options?.signal;
          signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
        }),
    );
    vi.stubGlobal('fetch', send);
    const service = new ResendEmailService(new ConfigService({
      RESEND_API_KEY: 'test-key',
      EMAIL_FROM: 'hello@example.com',
    }));
    const result = service.sendVerificationEmail('ana@example.com', 'https://web.example/link');
    const outcome = result.catch((error: unknown) => error);
    const signal = send.mock.calls[0]?.[1]?.signal;
    await vi.advanceTimersByTimeAsync(9999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(signal?.aborted).toBe(true);
    expect(await outcome).toBeInstanceOf(Error);
    expect(send).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

it.each([200, 429])('cancels an unread provider response body with HTTP %i', async (status) => {
  const cancel = vi.fn();
  const body = new ReadableStream({ cancel });
  const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status }));
  vi.stubGlobal('fetch', send);
  const service = new ResendEmailService(new ConfigService({
    RESEND_API_KEY: 'test-key',
    EMAIL_FROM: 'hello@example.com',
  }));

  const result = service.sendVerificationEmail('ana@example.com', 'https://web.example/link');
  if (status === 200) {
    await expect(result).resolves.toBeUndefined();
  } else {
    await expect(result).rejects.toThrow('Verification email was not accepted');
  }

  expect(cancel).toHaveBeenCalledOnce();
});
