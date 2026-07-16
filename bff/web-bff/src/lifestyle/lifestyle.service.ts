import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChannelAncillaryService } from '@regenera/channel-persistence';
import { LIFESTYLE_MODULES, resolveLifestyleModule } from './lifestyle-domains.registry';

@Injectable()
export class LifestyleService {
  constructor(private readonly ancillary: ChannelAncillaryService) {}

  listModules() {
    return LIFESTYLE_MODULES.map((m) => ({
      id: m.id,
      label: m.label,
      viewId: m.viewId,
      status: 'ACTIVE_SANDBOX',
    }));
  }

  getCatalog(userId: string, moduleId: string) {
    const mod = this.requireModule(moduleId);
    const items = [
      {
        id: `${moduleId}-item-1`,
        name: `${mod.label} Sandbox`,
        priceCents: '100',
        sandbox: true,
      },
      {
        id: `${moduleId}-item-2`,
        name: `${mod.label} Premium`,
        priceCents: '500',
        sandbox: true,
      },
    ];
    void this.Audit(userId, moduleId, 'get_catalog', 'ACCEPTED');
    return { moduleId, items, sandbox: true };
  }

  getActivation(moduleId: string) {
    this.requireModule(moduleId);
    return {
      externalProviderActive: false,
      sandbox: true,
      message: 'EXTERNAL_ACTIVATION_REQUIRED — parceiro lifestyle não ativo em produção',
    };
  }

  executeAction(
    userId: string,
    moduleId: string,
    action: string,
    idempotencyKey: string,
    payload: Record<string, unknown> = {},
  ) {
    this.requireModule(moduleId);
    const referenceId = randomUUID();
    void this.Audit(userId, moduleId, action, 'ACCEPTED', referenceId);
    return {
      referenceId,
      status: 'ACCEPTED',
      moduleId,
      action,
      idempotencyKey,
      metadata: { sandbox: true, ...payload },
    };
  }

  private requireModule(moduleId: string) {
    const mod = resolveLifestyleModule(moduleId);
    if (!mod) {
      throw new BadRequestException(`Módulo lifestyle desconhecido: ${moduleId}`);
    }
    return mod;
  }

  private async Audit(
    userId: string,
    moduleId: string,
    action: string,
    status: string,
    referenceId?: string,
  ): Promise<void> {
    await this.ancillary.recordLifestyleAudit(
      userId,
      moduleId,
      action,
      referenceId ?? randomUUID(),
      status,
    );
  }
}