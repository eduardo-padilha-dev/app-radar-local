import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendEmailService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async sendVerificationEmail(to: string, link: string): Promise<void> {
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
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Verification email was not accepted');
  }
}
