import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class VerificationToken {
  issue() {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
