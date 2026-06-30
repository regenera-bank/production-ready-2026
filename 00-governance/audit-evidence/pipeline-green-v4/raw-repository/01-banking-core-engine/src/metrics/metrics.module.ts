import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventEntity } from '../core/entities/outbox-event.entity';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventEntity])],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
