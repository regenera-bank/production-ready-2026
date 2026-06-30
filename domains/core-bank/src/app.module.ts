import { Module } from '@nestjs/common';
import { CoreBankHealthController } from './core-bank-health.controller';
import { CoreBankModule } from './core-bank.module';

@Module({
  imports: [CoreBankModule],
  controllers: [CoreBankHealthController],
})
export class AppModule {}

export * from './public-api';