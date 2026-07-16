export type ModuleClassification =
  | 'PRODUCTION'
  | 'SANDBOX'
  | 'DISABLED'
  | 'ADMIN_ONLY'
  | 'EXTERNAL_ACTIVATION';

export interface HomeModule {
  readonly moduleId: string;
  readonly slug: string;
  readonly classification: ModuleClassification;
  readonly enabled: boolean;
}

/** IDs estáveis dos módulos de home para canais nativos (M01–M23). */
export const CANONICAL_HOME_MODULES: readonly HomeModule[] = [
  { moduleId: 'M01', slug: 'home', classification: 'PRODUCTION', enabled: true },
  { moduleId: 'M02', slug: 'transactions', classification: 'PRODUCTION', enabled: true },
  { moduleId: 'M03', slug: 'pix', classification: 'PRODUCTION', enabled: true },
  { moduleId: 'M04', slug: 'transfer', classification: 'PRODUCTION', enabled: true },
  { moduleId: 'M05', slug: 'cards', classification: 'SANDBOX', enabled: true },
  { moduleId: 'M06', slug: 'investments', classification: 'SANDBOX', enabled: true },
  { moduleId: 'M07', slug: 'profile', classification: 'PRODUCTION', enabled: true },
  { moduleId: 'M08', slug: 'crypto', classification: 'DISABLED', enabled: false },
  { moduleId: 'M09', slug: 'credit', classification: 'SANDBOX', enabled: true },
  { moduleId: 'M10', slug: 'protection', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M11', slug: 'cloud', classification: 'DISABLED', enabled: false },
  { moduleId: 'M12', slug: 'kids', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M13', slug: 'senior', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M14', slug: 'pets', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M15', slug: 'dreams', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M16', slug: 'marketplace', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M17', slug: 'rewards', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M18', slug: 'discounts', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M19', slug: 'events', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M20', slug: 'travel', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M21', slug: 'sustainability', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M22', slug: 'academy', classification: 'SANDBOX', enabled: false },
  { moduleId: 'M23', slug: 'analytics', classification: 'SANDBOX', enabled: false },
] as const;