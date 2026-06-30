import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; layer: string; channel: string } {
    return { status: 'ok', layer: 'mobile-bff', channel: 'android' };
  }
}