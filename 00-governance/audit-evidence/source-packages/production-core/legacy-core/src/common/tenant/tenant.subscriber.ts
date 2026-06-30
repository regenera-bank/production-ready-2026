import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  LoadEvent,
} from 'typeorm';
import { getTenantContext } from './tenant.context';

export class TenantIsolationViolationException extends BadRequestException {
  constructor(message: string) {
    super(`TenantIsolationViolation: ${message}`);
  }
}

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  /**
   * Entidades que devem ter isolamento por tenant.
   * No momento, AccountEntity e TransactionEntity.
   */
  private readonly tenantAwareEntities = ['AccountEntity', 'TransactionEntity'];

  private isTenantAware(entityName: string): boolean {
    return this.tenantAwareEntities.includes(entityName);
  }

  private enforceTenantIsolation(
    entity: any,
    entityName: string,
    action: string,
  ) {
    if (!this.isTenantAware(entityName)) return;

    const context = getTenantContext();
    if (!context || !context.tenantId) {
      // Bypass para scripts internos ou testes que rodam sem contexto (opcional).
      // Num ambiente BaaS rígido, lançaria exceção. Aqui vamos permitir bypass condicional se for o sistema.
      if (process.env.ALLOW_CROSS_TENANT === 'true') return;

      throw new TenantIsolationViolationException(
        `Operação ${action} em ${entityName} bloqueada. Contexto de tenant ausente.`,
      );
    }

    if (action === 'insert') {
      if (!entity.tenantId) {
        entity.tenantId = context.tenantId; // Injeção automática
      } else if (entity.tenantId !== context.tenantId) {
        throw new TenantIsolationViolationException(
          `Tentativa de ${action} cruzado: Contexto = ${context.tenantId}, Entidade = ${entity.tenantId}`,
        );
      }
    } else {
      // Update, Remove, Load
      if (!entity.tenantId && (action === 'update' || action === 'remove')) {
        entity.tenantId = context.tenantId; // Injeção defensiva
      }

      if (entity.tenantId && entity.tenantId !== context.tenantId) {
        throw new TenantIsolationViolationException(
          `Tentativa de acesso cruzado (${action}): Contexto = ${context.tenantId}, Entidade = ${entity.tenantId}`,
        );
      }
    }
  }

  afterLoad(entity: any, event?: LoadEvent<any>) {
    if (!entity) return;
    this.enforceTenantIsolation(
      entity,
      event?.metadata.name || entity.constructor.name,
      'load',
    );
  }

  beforeInsert(event: InsertEvent<any>) {
    this.enforceTenantIsolation(event.entity, event.metadata.name, 'insert');
  }

  beforeUpdate(event: UpdateEvent<any>) {
    if (event.entity) {
      this.enforceTenantIsolation(event.entity, event.metadata.name, 'update');
    }
  }

  beforeRemove(event: RemoveEvent<any>) {
    if (event.entity) {
      this.enforceTenantIsolation(event.entity, event.metadata.name, 'remove');
    }
  }
}
