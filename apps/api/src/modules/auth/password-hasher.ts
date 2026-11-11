import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt } from 'node:crypto';

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password,
        salt,
        64,
        { N: 16384, r: 8, p: 1, maxmem: 67108864 },
        (error, result) => (error ? reject(error) : resolve(result)),
      );
    });
    return `v1$scrypt$16384$8$1$67108864$${salt.toString('base64url')}$${key.toString('base64url')}`;
  }
}
