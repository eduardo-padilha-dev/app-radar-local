import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class VerificationToken {
  issue() {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}
