import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class CoreBankHealthController {
  @Get()
  check(): { status: string; domain: string } {
    return { status: 'ok', domain: 'core-bank' };
  }
}