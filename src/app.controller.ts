import { Controller, Get } from '@nestjs/common';
import { Public } from './users/decorators/public.decorator';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
