import { Global, Module } from '@nestjs/common';
import { TenantSubscriber } from './tenant.subscriber';

@Global()
@Module({
  providers: [TenantSubscriber],
  exports: [TenantSubscriber],
})
export class TenantModule {}
