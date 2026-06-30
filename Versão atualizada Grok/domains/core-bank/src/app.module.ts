import { Module } from '@nestjs/common';
import { CoreBankHealthController } from './core-bank-health.controller';

@Module({
  controllers: [CoreBankHealthController],
})
export class AppModule {}