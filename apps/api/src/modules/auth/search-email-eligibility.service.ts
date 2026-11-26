import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PublicApiException } from '../../common/api-exception.filter.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class SearchEmailEligibilityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // TODO US04: Call this rule before evaluating the remaining search conditions or consuming the demo.
  async assertEmailVerified(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });

    if (user.emailVerifiedAt === null) {
      throw new PublicApiException(
        {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Confirme seu e-mail para fazer buscas.',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
