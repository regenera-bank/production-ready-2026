import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: string; layer: string; channel: string } {
    return {
      status: 'ok',
      layer: 'operations-bff',
      channel: 'windows-operations',
    };
  }

  @Public()
  @Get('ready')
  ready(): {
    status: string;
    dependencies: Record<string, string>;
  } {
    const coreConfigured = Boolean(process.env.CORE_API_BASE_URL?.trim());
    return {
      status: coreConfigured ? 'ok' : 'degraded',
      dependencies: {
        coreApi: coreConfigured ? 'configured' : 'stub',
        ledger: 'read-only-stub',
        cases: 'stub',
      },
    };
  }
}