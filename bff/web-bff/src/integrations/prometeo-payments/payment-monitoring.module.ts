import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PrometeoBankingClient } from './prometeo-banking.client';
import { PrometeoPaymentsClient } from './prometeo-payments.client';
import { PaymentMonitoringController } from './payment-monitoring.controller';
import { PaymentMonitoringService } from './payment-monitoring.service';

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [PaymentMonitoringController],
  providers: [
    PrometeoBankingClient,
    PrometeoPaymentsClient,
    PaymentMonitoringService,
  ],
  exports: [PaymentMonitoringService],
})
export class PaymentMonitoringModule {}