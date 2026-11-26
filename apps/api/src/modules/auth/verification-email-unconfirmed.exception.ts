import { HttpStatus } from '@nestjs/common';
import { PublicApiException } from '../../common/api-exception.filter.js';

export class VerificationEmailUnconfirmedException extends PublicApiException {
  constructor(cause: unknown) {
    super(
      {
        code: 'VERIFICATION_EMAIL_UNCONFIRMED',
        message:
          'Sua conta foi criada, mas não conseguimos confirmar o envio do e-mail de confirmação. Tente reenviar o link.',
        details: { accountCreated: true, emailVerificationPending: true },
      },
      HttpStatus.BAD_GATEWAY,
      { cause },
    );
  }
}
