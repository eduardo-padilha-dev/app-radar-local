import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../../generated/prisma/enums.js';

export class SessionProfile {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  role: Role;
}
