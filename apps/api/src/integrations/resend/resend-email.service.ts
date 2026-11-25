import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendEmailService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async sendVerificationEmail(to: string, link: string): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow<string>('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.getOrThrow<string>('EMAIL_FROM'),
          to: [to],
          subject: 'Confirme seu cadastro no Radar Local',
          text: `Confirme seu cadastro: ${link}`,
        }),
        signal: controller.signal,
      });
      // The provider status determines the outcome, even if its body has already errored.
      await response.body?.cancel().catch(() => undefined);
      if (!response.ok) throw new Error('Verification email was not accepted');
    } finally {
      clearTimeout(timeout);
    }
  }
}
