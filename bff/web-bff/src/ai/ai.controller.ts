import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { AiService } from './ai.service';
import { AiChatBody, AiSpeakBody, AiTelegramBody } from './ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @UseGuards(SessionGuard)
  chat(@Body() body: AiChatBody) {
    return this.ai.chat(body.message, body.context);
  }

  @Post('speak')
  @UseGuards(SessionGuard)
  async speak(@Body() body: AiSpeakBody) {
    const audio = await this.ai.speak(body.text, body.voice ?? 'Kore');
    return { audioBase64: audio };
  }

  @Post('telegram')
  @UseGuards(SessionGuard)
  telegram(@Body() body: AiTelegramBody) {
    return this.ai.sendTelegram(body.message);
  }
}