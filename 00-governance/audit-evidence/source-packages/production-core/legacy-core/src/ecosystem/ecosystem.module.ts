import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventEntity } from '../core/entities/outbox-event.entity';
import { EcosystemEventBusService } from './ecosystem-event-bus.service';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventEntity])],
  providers: [EcosystemEventBusService],
  exports: [EcosystemEventBusService],
})
export class EcosystemModule {}
