import type { ModuleId } from '../types';

export interface LifestyleViewDef {
  readonly navId: ModuleId;
  readonly moduleId: string;
  readonly label: string;
}

/** Mapeamento nav → GET /lifestyle/:moduleId/catalog (BFF sandbox). */
export const LIFESTYLE_VIEWS: readonly LifestyleViewDef[] = [
  { navId: 'marketplace', moduleId: 'marketplace', label: 'Marketplace' },
  { navId: 'rewards', moduleId: 'rewards', label: 'Rewards' },
  { navId: 'travel', moduleId: 'travel', label: 'Viagens' },
  { navId: 'realizar', moduleId: 'dreams', label: 'Realizar' },
  { navId: 'benefits', moduleId: 'benefits', label: 'Descontos' },
  { navId: 'discounts', moduleId: 'benefits', label: 'Descontos' },
  { navId: 'kids', moduleId: 'kids', label: 'Kids' },
  { navId: 'kids-account', moduleId: 'kids', label: 'Kids' },
  { navId: 'pet-savings', moduleId: 'pets', label: 'Pets' },
  { navId: 'events', moduleId: 'events', label: 'Eventos' },
  { navId: 'sustainability', moduleId: 'sustainability', label: 'Sustentabilidade' },
  { navId: 'academy', moduleId: 'academy', label: 'Academy' },
  { navId: 'analytics', moduleId: 'analytics', label: 'Analytics' },
  { navId: 'protection', moduleId: 'protection', label: 'Proteção' },
  { navId: 'cloud', moduleId: 'cloud', label: 'Cloud' },
] as const;

export const resolveLifestyleView = (navId: ModuleId): LifestyleViewDef | undefined =>
  LIFESTYLE_VIEWS.find((view) => view.navId === navId);