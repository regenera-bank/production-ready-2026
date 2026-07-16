import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { RbacGuard } from './auth/rbac.guard';
import { CasesModule } from './cases/cases.module';
import { HealthController } from './health.controller';
import { LedgerModule } from './ledger/ledger.module';

@Module({
  imports: [AuthModule, LedgerModule, CasesModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class OperationsBffModule {}