import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiProductEntity } from './entities/api-product.entity';
import { ApiSubscriptionEntity } from './entities/api-subscription.entity';
import { DeveloperPortalService } from './developer-portal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiProductEntity, ApiSubscriptionEntity]),
  ],
  providers: [DeveloperPortalService],
  exports: [DeveloperPortalService],
})
export class DeveloperPortalModule {}
