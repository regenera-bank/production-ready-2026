import { Controller, Get } from '@nestjs/common';
import { mtlsConfigSpec } from './common/mtls.config';

@Controller('health')
export class HealthController {
  @Get()
  check(): {
    status: string;
    layer: string;
    sandboxMode: boolean;
    mtls: ReturnType<typeof mtlsConfigSpec>;
  } {
    return {
      status: 'ok',
      layer: 'partner-api-facade',
      sandboxMode: process.env.PARTNER_SANDBOX_MODE?.trim().toLowerCase() !== 'false',
      mtls: mtlsConfigSpec(),
    };
  }
}