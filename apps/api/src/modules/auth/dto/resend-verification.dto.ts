import { PickType } from '@nestjs/swagger';
import { RegisterDto } from './register.dto.js';

export class ResendVerificationDto extends PickType(RegisterDto, [
  'email',
] as const) {}
