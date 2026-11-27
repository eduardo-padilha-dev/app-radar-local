import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 67108864 };
const HASH_PREFIX = `v1$scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${SCRYPT_OPTIONS.maxmem}$`;
const MISSING_HASH = encodeHash(
  randomBytes(SALT_LENGTH),
  randomBytes(KEY_LENGTH),
);

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt);
    return encodeHash(salt, key);
  }

  async verify(password: string, hash: string | undefined): Promise<boolean> {
    const hashToVerify = hash ?? MISSING_HASH;
    if (!hashToVerify.startsWith(HASH_PREFIX)) {
      return false;
    }

    const [encodedSalt, encodedKey, extra] = hashToVerify
      .slice(HASH_PREFIX.length)
      .split('$', 3);
    if (!encodedSalt || !encodedKey || extra !== undefined) {
      return false;
    }

    const salt = Buffer.from(encodedSalt, 'base64url');
    const expectedKey = Buffer.from(encodedKey, 'base64url');
    if (
      salt.length !== SALT_LENGTH ||
      expectedKey.length !== KEY_LENGTH ||
      salt.toString('base64url') !== encodedSalt ||
      expectedKey.toString('base64url') !== encodedKey
    ) {
      return false;
    }

    const actualKey = await deriveKey(password, salt);
    const matches = timingSafeEqual(actualKey, expectedKey);
    return hash !== undefined && matches;
  }
}

function encodeHash(salt: Buffer, key: Buffer): string {
  return `${HASH_PREFIX}${salt.toString('base64url')}$${key.toString('base64url')}`;
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, result) =>
      error ? reject(error) : resolve(result),
    );
  });
}
