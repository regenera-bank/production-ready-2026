import { Controller, Get, Param } from '@nestjs/common';
import { RequirePermission } from '../auth/require-permission.decorator';
import { LedgerReadonlyService } from './ledger-readonly.service';

@Controller('ledger')
export class LedgerReadonlyController {
  constructor(private readonly ledger: LedgerReadonlyService) {}

  @Get('accounts')
  @RequirePermission('ledger:read')
  listAccounts() {
    return this.ledger.listAccounts();
  }

  @Get('accounts/:accountId/entries')
  @RequirePermission('ledger:read')
  listEntries(@Param('accountId') accountId: string) {
    return this.ledger.listEntries(accountId);
  }
}