export interface LifestyleModuleDef {
  readonly id: string;
  readonly label: string;
  readonly viewId: string;
}

export const LIFESTYLE_MODULES: readonly LifestyleModuleDef[] = [
  { id: 'marketplace', label: 'Marketplace', viewId: 'view-marketplace' },
  { id: 'rewards', label: 'Rewards', viewId: 'view-rewards' },
  { id: 'benefits', label: 'Descontos', viewId: 'view-discounts' },
  { id: 'kids', label: 'Kids', viewId: 'view-kids' },
  { id: 'pets', label: 'Pets', viewId: 'view-pets' },
  { id: 'dreams', label: 'Sonhos', viewId: 'view-dreams' },
  { id: 'events', label: 'Eventos', viewId: 'view-events' },
  { id: 'travel', label: 'Viagens', viewId: 'view-travel' },
  { id: 'sustainability', label: 'Sustentabilidade', viewId: 'view-sustainability' },
  { id: 'academy', label: 'Academy', viewId: 'view-academy' },
  { id: 'analytics', label: 'Analytics', viewId: 'view-analytics' },
  { id: 'protection', label: 'Proteção', viewId: 'view-protection' },
  { id: 'cloud', label: 'Cloud', viewId: 'view-cloud' },
] as const;

export const lifestyleModuleIds = (): string[] => LIFESTYLE_MODULES.map((m) => m.id);

export const resolveLifestyleModule = (moduleId: string): LifestyleModuleDef | undefined =>
  LIFESTYLE_MODULES.find((m) => m.id === moduleId);