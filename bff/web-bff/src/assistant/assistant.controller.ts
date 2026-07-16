import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import { AssistantService } from './assistant.service';
import { AssistantChatBody, AssistantSpeakBody, AssistantTelegramBody } from './assistant.dto';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('chat')
  @UseGuards(SessionGuard)
  chat(@Body() body: AssistantChatBody) {
    return this.assistant.chat(body.message, body.context);
  }

  @Post('speak')
  @UseGuards(SessionGuard)
  async speak(@Body() body: AssistantSpeakBody) {
    const audio = await this.assistant.speak(body.text, body.voice ?? 'Kore');
    return { audioBase64: audio };
  }

  @Post('telegram')
  @UseGuards(SessionGuard)
  telegram(@Body() body: AssistantTelegramBody) {
    return this.assistant.sendTelegram(body.message);
  }
}