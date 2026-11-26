import { scrypt as derive } from 'node:crypto';
import { PasswordHasher } from './password-hasher.js';

it('stores distinct salts and the specified reproducible scrypt parameters for equal passwords', async () => {
  const hasher = new PasswordHasher();
  const first = await hasher.hash('same password');
  const second = await hasher.hash('same password');
  expect(first).not.toBe(second);
  const [version, algorithm, n, r, p, maxmem, salt, hash] = first.split('$');
  expect([version, algorithm, n, r, p, maxmem]).toEqual([
    'v1',
    'scrypt',
    '16384',
    '8',
    '1',
    '67108864',
  ]);
  expect(Buffer.from(salt!, 'base64url')).toHaveLength(16);
  expect(Buffer.from(hash!, 'base64url')).toHaveLength(64);
  const expected = await new Promise<Buffer>((resolve, reject) =>
    derive(
      'same password',
      Buffer.from(salt!, 'base64url'),
      64,
      { N: 16384, r: 8, p: 1, maxmem: 67108864 },
      (error, result) => (error ? reject(error) : resolve(result)),
    ),
  );
  expect(Buffer.from(hash!, 'base64url')).toEqual(expected);
  expect(first).not.toContain('same password');
});

describe('PasswordHasher.verify', () => {
  const registeredPassword = 'registered password';
  // Emitted by the registration hasher before verification was introduced.
  const registeredHash =
    'v1$scrypt$16384$8$1$67108864$5qF7wDbhOn0iS0sFAIvRhA$j13QxugxgkZmg1mdcSkhfSgOHWF5KXMoFmiNigsiwhL_5AEScyd9JiByQ6odMlEHNTb4W22hTcp1XZSdakbz2w';
  const hasher = new PasswordHasher();

  it('accepts the original password for a previously issued registration hash', async () => {
    await expect(
      hasher.verify(registeredPassword, registeredHash),
    ).resolves.toBe(true);
  });

  it('rejects a wrong password for a registration hash', async () => {
    await expect(hasher.verify('wrong password', registeredHash)).resolves.toBe(
      false,
    );
  });

  it.each([
    ['an unknown format', 'invalid-hash'],
    ['unsupported parameters', registeredHash.replace('$16384$', '$32768$')],
    ['a short salt', registeredHash.replace('5qF7wDbhOn0iS0sFAIvRhA', 'YQ')],
    ['a truncated key', registeredHash.slice(0, -1)],
    ['noncanonical encoding', registeredHash + '='],
    ['an extra field', registeredHash + '$'],
  ])('rejects %s', async (_description, invalidHash) => {
    await expect(hasher.verify(registeredPassword, invalidHash)).resolves.toBe(
      false,
    );
  });
});
