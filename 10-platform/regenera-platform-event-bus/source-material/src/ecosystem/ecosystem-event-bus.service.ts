import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEventEntity } from '../core/entities/outbox-event.entity';
import { DomainEvent } from '../events/contracts/domain-event.interface';

@Injectable()
export class EcosystemEventBusService {
  private readonly logger = new Logger(EcosystemEventBusService.name);

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepo: Repository<OutboxEventEntity>,
  ) {}

  async publish<T>(topic: string, event: DomainEvent<T>): Promise<void> {
    this.logger.log(
      `Publishing ecosystem event [${topic}] from source [${event.source}]`,
    );

    const outboxEntry = this.outboxRepo.create({
      topic,
      payload: event as any,
    });

    await this.outboxRepo.save(outboxEntry);
    this.logger.log(
      `Event [${event.eventId}] published to outbox successfully.`,
    );
  }
}
