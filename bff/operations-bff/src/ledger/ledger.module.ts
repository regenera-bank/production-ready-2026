import { Module } from '@nestjs/common';
import { LedgerReadonlyController } from './ledger-readonly.controller';
import { LedgerReadonlyService } from './ledger-readonly.service';

@Module({
  controllers: [LedgerReadonlyController],
  providers: [LedgerReadonlyService],
  exports: [LedgerReadonlyService],
})
export class LedgerModule {}