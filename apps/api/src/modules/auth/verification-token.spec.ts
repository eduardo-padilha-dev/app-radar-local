import { createHash } from 'node:crypto';
import { VerificationToken } from './verification-token.js';

afterEach(() => {
  vi.useRealTimers();
});
it('issues unpredictable 32-byte tokens, SHA-256 hashes and exactly 24 hours of validity', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T15:30:00.123Z'));
  const generator = new VerificationToken();
  const issued = generator.issue();
  expect(issued.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(Buffer.from(issued.token, 'base64url')).toHaveLength(32);
  expect(issued.tokenHash).toBe(
    createHash('sha256').update(issued.token).digest('hex'),
  );
  expect(issued.expiresAt).toEqual(new Date('2026-11-11T15:30:00.123Z'));
  expect(generator.issue().token).not.toBe(issued.token);
});
