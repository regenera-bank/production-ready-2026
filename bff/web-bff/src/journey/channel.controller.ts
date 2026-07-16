import { Controller, Get } from '@nestjs/common';
import type { ChannelBootstrapResponse } from './journey.types';

@Controller('channel')
export class ChannelController {
  @Get('bootstrap')
  bootstrap(): ChannelBootstrapResponse {
    return {
      status: 'ok',
      maintenance: false,
      minAppVersion: '1.0.0',
      channelContractVersion: '2026-07-02-wave1',
      journeyRequired: true,
      supportedChannels: ['WEB', 'ANDROID', 'IOS', 'DESKTOP', 'PWA'],
    };
  }
}