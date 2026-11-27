import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('sistema')
@ApiInternalServerErrorResponse({ description: 'Erro interno do servidor.' })
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se a API responde' })
  @ApiOkResponse({
    description: 'API disponível.',
    schema: {
      type: 'object',
      required: ['data'],
      properties: { data: { type: 'string' } },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
