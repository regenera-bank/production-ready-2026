#!/usr/bin/env node
/**
 * Scaffolds Regenera Bank domain packages with port/adapter/simulator pattern.
 * Run: node scripts/scaffold-domains.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOMAINS_DIR = path.join(ROOT, 'domains');

const DELEGATION_DOMAINS = new Set([
  'accounts',
  'ledger',
  'reconciliation',
  'payments',
  'pix',
]);

const DOMAIN_CATALOG = [
  { name: 'identity', summary: 'Authentication, MFA, and principal lifecycle.' },
  { name: 'customers', summary: 'Customer profile and party registry.' },
  { name: 'consent', summary: 'LGPD consent capture and revocation.' },
  { name: 'devices', summary: 'Device trust and binding.' },
  { name: 'notifications', summary: 'Outbound notification orchestration.' },
  { name: 'kyc', summary: 'Know-your-customer verification workflows.' },
  { name: 'aml', summary: 'Anti-money-laundering monitoring.' },
  { name: 'fraud', summary: 'Fraud scoring and decisioning.' },
  { name: 'sanctions', summary: 'Sanctions screening and watchlists.' },
  { name: 'case-management', summary: 'Investigation cases and maker-checker.' },
  { name: 'accounts', summary: 'Ledger accounts — delegates to @regenera/core-bank.', delegate: true },
  { name: 'ledger', summary: 'Journal entries — delegates to @regenera/core-bank.', delegate: true },
  { name: 'transactions', summary: 'Customer-facing transaction history and receipts.' },
  { name: 'accounting', summary: 'Management accounting and chart of accounts.' },
  { name: 'reconciliation', summary: 'UNKNOWN reconciliation — delegates to @regenera/core-bank.', delegate: true },
  { name: 'payments', summary: 'Payment engine — delegates to @regenera/core-bank.', delegate: true },
  { name: 'pix', summary: 'PIX engine + SPI/DICT integration surface.', delegate: true, spiDict: true },
  { name: 'transfers', summary: 'TED/DOC and internal transfer orchestration.' },
  { name: 'cards', summary: 'Card product lifecycle.' },
  { name: 'card-authorization', summary: 'Card authorization and limits at auth time.' },
  { name: 'card-invoices', summary: 'Card billing cycles and invoices.' },
  { name: 'disputes', summary: 'Chargeback and dispute cases.' },
  { name: 'credit', summary: 'Credit lines and lending products.' },
  { name: 'limits', summary: 'Transactional and product limits.' },
  { name: 'fees', summary: 'Fee schedules and accrual.' },
  { name: 'collections', summary: 'Delinquency and collections workflows.' },
  { name: 'investments', summary: 'Investment positions and orders.' },
  { name: 'suitability', summary: 'Investor suitability profiling.' },
  { name: 'orders', summary: 'Order intake for tradable assets.' },
  { name: 'custody', summary: 'Asset custody and safekeeping.' },
  { name: 'crypto', summary: 'Virtual assets program (regulatory gate).', regulatory: true },
  { name: 'protection', summary: 'Insurance-like protection products.' },
  { name: 'insurance', summary: 'Insurance policy administration.' },
  { name: 'marketplace', summary: 'Partner marketplace catalog.' },
  { name: 'benefits', summary: 'Employee and partner benefits.' },
  { name: 'rewards', summary: 'Loyalty points and rewards.' },
  { name: 'dreams', summary: 'Savings goals (dreams) product.' },
  { name: 'kids', summary: 'Minor accounts and parental controls.' },
  { name: 'senior', summary: 'Senior banking adaptations.' },
  { name: 'pets', summary: 'Pet-related financial products.' },
  { name: 'travel', summary: 'Travel benefits and FX helpers.' },
  { name: 'events', summary: 'Event ticketing and benefits.' },
  { name: 'sustainability', summary: 'ESG and carbon offset programs.' },
  { name: 'academy', summary: 'Financial education content.' },
  { name: 'analytics', summary: 'Product analytics and insights.' },
  { name: 'integrations-spi', summary: 'BACEN SPI and DICT rail adapters.', spiDict: true },
];

function pascalCase(kebab) {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function camelCase(kebab) {
  const p = pascalCase(kebab);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function envKey(name) {
  return `${name.replace(/-/g, '_').toUpperCase()}_ADAPTER`;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function activationBlock(domain, kind) {
  if (kind === 'production') {
    return `export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(\`[\${domain}] adapter "\${adapter}" requires external activation — see README.md\`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });`;
  }
  if (kind === 'regulatory') {
    return `export const REGULATORY_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(\`[\${domain}] adapter "\${adapter}" requires regulatory activation — feature flag off\`), {
    code: 'REGULATORY_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });`;
  }
  return '';
}

function portFile(domain, meta) {
  const Pascal = pascalCase(domain);
  const token = `${domain.replace(/-/g, '_').toUpperCase()}_PORT`;
  const delegateNote = meta.delegate
    ? `\n * Delegation: production path targets @regenera/core-bank — see README.md.`
    : '';
  const regulatory = meta.regulatory
    ? `\nexport const REGULATORY_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(\`[\${domain}] adapter "\${adapter}" requires regulatory activation — feature flag off\`), {
    code: 'REGULATORY_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });`
    : '';

  return `/**
 * ${Pascal} port — contract boundary for ${meta.summary}${delegateNote}
 */
export const ${token} = Symbol('${token}');

export type ${Pascal}AdapterKind = 'simulator' | 'sandbox' | 'production';

export interface ${Pascal}Health {
  ok: boolean;
  domain: '${domain}';
  adapter: ${Pascal}AdapterKind;
}

export interface ${Pascal}Command {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface ${Pascal}Result {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface ${Pascal}Port {
  readonly kind: ${Pascal}AdapterKind;
  health(): Promise<${Pascal}Health>;
  execute(command: ${Pascal}Command): Promise<${Pascal}Result>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(\`[\${domain}] adapter "\${adapter}" requires external activation — see README.md\`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });${regulatory}
`;
}

function spiDictPortFiles() {
  const spiPort = `/**
 * SPI (Sistema de Pagamentos Instantâneos) port — BACEN rail boundary.
 */
export const SPI_PORT = Symbol('SPI_PORT');

export type SpiAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface SpiHealth {
  ok: boolean;
  domain: 'integrations-spi';
  rail: 'SPI';
  adapter: SpiAdapterKind;
}

export interface SpiTransferCommand {
  idempotencyKey: string;
  endToEndId: string;
  amountCents: string;
  payerIspb: string;
  payeeIspb: string;
}

export interface SpiTransferResult {
  endToEndId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
}

export interface SpiPort {
  readonly kind: SpiAdapterKind;
  health(): Promise<SpiHealth>;
  submitTransfer(command: SpiTransferCommand): Promise<SpiTransferResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(\`[\${domain}] adapter "\${adapter}" requires external activation — see README.md\`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
`;

  const dictPort = `/**
 * DICT (Diretório de Identificadores de Contas Transacionais) port.
 */
export const DICT_PORT = Symbol('DICT_PORT');

export type DictAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface DictHealth {
  ok: boolean;
  domain: 'integrations-spi';
  rail: 'DICT';
  adapter: DictAdapterKind;
}

export interface DictLookupCommand {
  pixKey: string;
  requesterIspb: string;
}

export interface DictLookupResult {
  pixKey: string;
  found: boolean;
  ownerMasked?: string;
  ispb?: string;
}

export interface DictPort {
  readonly kind: DictAdapterKind;
  health(): Promise<DictHealth>;
  lookupKey(command: DictLookupCommand): Promise<DictLookupResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(\`[\${domain}] adapter "\${adapter}" requires external activation — see README.md\`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
`;

  return { spiPort, dictPort };
}

function adapterFile(domain, meta, tier) {
  const Pascal = pascalCase(domain);
  const className = `${Pascal}${tier === 'production' ? 'Production' : tier === 'sandbox' ? 'Sandbox' : 'Simulator'}Adapter`;
  const kind = tier;

  if (tier === 'production') {
    const throwFn = meta.regulatory ? 'REGULATORY_ACTIVATION_REQUIRED' : 'EXTERNAL_ACTIVATION_REQUIRED';
    return `import { Injectable } from '@nestjs/common';
import {
  ${throwFn},
  ${Pascal}AdapterKind,
  ${Pascal}Command,
  ${Pascal}Health,
  ${Pascal}Port,
  ${Pascal}Result,
} from '../../ports/${domain}.port';

@Injectable()
export class ${className} implements ${Pascal}Port {
  readonly kind: ${Pascal}AdapterKind = 'production';

  async health(): Promise<${Pascal}Health> {
    throw ${throwFn}('${domain}', 'production');
  }

  async execute(_command: ${Pascal}Command): Promise<${Pascal}Result> {
    throw ${throwFn}('${domain}', 'production');
  }
}
`;
  }

  if (tier === 'sandbox') {
    return `import { Injectable } from '@nestjs/common';
import {
  ${Pascal}AdapterKind,
  ${Pascal}Command,
  ${Pascal}Health,
  ${Pascal}Port,
  ${Pascal}Result,
} from '../../ports/${domain}.port';

@Injectable()
export class ${className} implements ${Pascal}Port {
  readonly kind: ${Pascal}AdapterKind = 'sandbox';
  private readonly store = new Map<string, ${Pascal}Result>();

  async health(): Promise<${Pascal}Health> {
    return { ok: true, domain: '${domain}', adapter: 'sandbox' };
  }

  async execute(command: ${Pascal}Command): Promise<${Pascal}Result> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: ${Pascal}Result = {
      referenceId: \`sbx-\${command.idempotencyKey}\`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
`;
  }

  // simulator
  const delegateComment = meta.delegate
    ? `    // Contract mirrors @regenera/core-bank; simulator stays local for CI.`
    : '';

  return `import { Injectable } from '@nestjs/common';
import {
  ${Pascal}AdapterKind,
  ${Pascal}Command,
  ${Pascal}Health,
  ${Pascal}Port,
  ${Pascal}Result,
} from '../../ports/${domain}.port';

@Injectable()
export class ${className} implements ${Pascal}Port {
  readonly kind: ${Pascal}AdapterKind = 'simulator';
  private readonly ledger = new Map<string, ${Pascal}Result>();

  async health(): Promise<${Pascal}Health> {
    return { ok: true, domain: '${domain}', adapter: 'simulator' };
  }

  async execute(command: ${Pascal}Command): Promise<${Pascal}Result> {
${delegateComment}
    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: ${Pascal}Result = {
      referenceId: \`sim-${domain}-\${command.idempotencyKey}\`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
`;
}

function spiAdapterFile(rail, tier) {
  const Pascal = rail === 'spi' ? 'Spi' : 'Dict';
  const domain = 'integrations-spi';
  const className = `${Pascal}${tier === 'production' ? 'Production' : tier === 'sandbox' ? 'Sandbox' : 'Simulator'}Adapter`;
  const portImport = rail === 'spi' ? 'spi.port' : 'dict.port';
  const method = rail === 'spi' ? 'submitTransfer' : 'lookupKey';
  const cmdType = rail === 'spi' ? 'SpiTransferCommand' : 'DictLookupCommand';
  const resType = rail === 'spi' ? 'SpiTransferResult' : 'DictLookupResult';
  const healthType = rail === 'spi' ? 'SpiHealth' : 'DictHealth';
  const kindType = rail === 'spi' ? 'SpiAdapterKind' : 'DictAdapterKind';
  const portType = rail === 'spi' ? 'SpiPort' : 'DictPort';
  const token = rail === 'spi' ? 'SPI_PORT' : 'DICT_PORT';
  const railLabel = rail === 'spi' ? 'SPI' : 'DICT';

  if (tier === 'production') {
    return `import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  ${cmdType},
  ${healthType},
  ${kindType},
  ${portType},
  ${resType},
} from '../../ports/${portImport}';

@Injectable()
export class ${className} implements ${portType} {
  readonly kind: ${kindType} = 'production';

  async health(): Promise<${healthType}> {
    throw EXTERNAL_ACTIVATION_REQUIRED('${domain}', 'production-${rail}');
  }

  async ${method}(_command: ${cmdType}): Promise<${resType}> {
    throw EXTERNAL_ACTIVATION_REQUIRED('${domain}', 'production-${rail}');
  }
}
`;
  }

  if (tier === 'sandbox') {
    if (rail === 'spi') {
      return `import { Injectable } from '@nestjs/common';
import {
  SpiAdapterKind,
  SpiHealth,
  SpiPort,
  SpiTransferCommand,
  SpiTransferResult,
} from '../../ports/spi.port';

@Injectable()
export class ${className} implements SpiPort {
  readonly kind: SpiAdapterKind = 'sandbox';

  async health(): Promise<SpiHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'SPI', adapter: 'sandbox' };
  }

  async submitTransfer(command: SpiTransferCommand): Promise<SpiTransferResult> {
    return { endToEndId: command.endToEndId, status: 'ACCEPTED' };
  }
}
`;
    }
    return `import { Injectable } from '@nestjs/common';
import {
  DictAdapterKind,
  DictHealth,
  DictLookupCommand,
  DictLookupResult,
  DictPort,
} from '../../ports/dict.port';

@Injectable()
export class ${className} implements DictPort {
  readonly kind: DictAdapterKind = 'sandbox';
  private readonly keys = new Map<string, DictLookupResult>([
    ['sandbox@regenera.bank', { pixKey: 'sandbox@regenera.bank', found: true, ownerMasked: 'S*** R***', ispb: '12345678' }],
  ]);

  async health(): Promise<DictHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'DICT', adapter: 'sandbox' };
  }

  async lookupKey(command: DictLookupCommand): Promise<DictLookupResult> {
    return (
      this.keys.get(command.pixKey) ?? {
        pixKey: command.pixKey,
        found: false,
      }
    );
  }
}
`;
  }

  // simulator
  if (rail === 'spi') {
    return `import { Injectable } from '@nestjs/common';
import {
  SpiAdapterKind,
  SpiHealth,
  SpiPort,
  SpiTransferCommand,
  SpiTransferResult,
} from '../../ports/spi.port';

@Injectable()
export class ${className} implements SpiPort {
  readonly kind: SpiAdapterKind = 'simulator';
  private readonly transfers = new Map<string, SpiTransferResult>();

  async health(): Promise<SpiHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'SPI', adapter: 'simulator' };
  }

  async submitTransfer(command: SpiTransferCommand): Promise<SpiTransferResult> {
    const cached = this.transfers.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: SpiTransferResult = {
      endToEndId: command.endToEndId,
      status: 'ACCEPTED',
    };
    this.transfers.set(command.idempotencyKey, result);
    return result;
  }
}
`;
  }

  return `import { Injectable } from '@nestjs/common';
import {
  DictAdapterKind,
  DictHealth,
  DictLookupCommand,
  DictLookupResult,
  DictPort,
} from '../../ports/dict.port';

@Injectable()
export class ${className} implements DictPort {
  readonly kind: DictAdapterKind = 'simulator';
  private readonly directory = new Map<string, DictLookupResult>();

  async health(): Promise<DictHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'DICT', adapter: 'simulator' };
  }

  async lookupKey(command: DictLookupCommand): Promise<DictLookupResult> {
    const cached = this.directory.get(command.pixKey);
    if (cached) {
      return cached;
    }
    const synthetic: DictLookupResult = {
      pixKey: command.pixKey,
      found: command.pixKey.includes('@'),
      ownerMasked: '***',
      ispb: command.requesterIspb,
    };
    this.directory.set(command.pixKey, synthetic);
    return synthetic;
  }
}
`;
}

function serviceFile(domain, meta) {
  const Pascal = pascalCase(domain);
  const token = `${domain.replace(/-/g, '_').toUpperCase()}_PORT`;
  return `import { Inject, Injectable } from '@nestjs/common';
import { ${token}, ${Pascal}Command, ${Pascal}Port, ${Pascal}Result } from './ports/${domain}.port';

@Injectable()
export class ${Pascal}Service {
  constructor(@Inject(${token}) private readonly port: ${Pascal}Port) {}

  health() {
    return this.port.health();
  }

  execute(command: ${Pascal}Command): Promise<${Pascal}Result> {
    return this.port.execute(command);
  }
}
`;
}

function moduleFile(domain) {
  const Pascal = pascalCase(domain);
  const camel = camelCase(domain);
  const token = `${domain.replace(/-/g, '_').toUpperCase()}_PORT`;
  const env = envKey(domain);
  return `import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ${Pascal}ProductionAdapter } from './adapters/production/${domain}-production.adapter';
import { ${Pascal}SandboxAdapter } from './adapters/sandbox/${domain}-sandbox.adapter';
import { ${Pascal}SimulatorAdapter } from './adapters/simulator/${domain}-simulator.adapter';
import { ${token}, ${Pascal}AdapterKind } from './ports/${domain}.port';
import { ${Pascal}Service } from './${domain}.service';

export interface ${Pascal}ModuleOptions {
  adapter?: ${Pascal}AdapterKind;
}

function resolveAdapter(options?: ${Pascal}ModuleOptions): ${Pascal}AdapterKind {
  const fromEnv = process.env.${env} as ${Pascal}AdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: ${Pascal}AdapterKind): Provider {
  const map = {
    simulator: ${Pascal}SimulatorAdapter,
    sandbox: ${Pascal}SandboxAdapter,
    production: ${Pascal}ProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: ${token}, useClass: impl };
}

@Module({})
export class ${Pascal}Module {
  static register(options?: ${Pascal}ModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: ${Pascal}Module,
      providers: [adapterProvider(kind), ${Pascal}Service],
      exports: [${Pascal}Service, ${token}],
    };
  }
}
`;
}

function integrationsSpiModule() {
  return `import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SpiProductionAdapter } from './adapters/production/spi-production.adapter';
import { SpiSandboxAdapter } from './adapters/sandbox/spi-sandbox.adapter';
import { SpiSimulatorAdapter } from './adapters/simulator/spi-simulator.adapter';
import { DictProductionAdapter } from './adapters/production/dict-production.adapter';
import { DictSandboxAdapter } from './adapters/sandbox/dict-sandbox.adapter';
import { DictSimulatorAdapter } from './adapters/simulator/dict-simulator.adapter';
import { SPI_PORT, SpiAdapterKind } from './ports/spi.port';
import { DICT_PORT, DictAdapterKind } from './ports/dict.port';
import { IntegrationsSpiService } from './integrations-spi.service';

export interface IntegrationsSpiModuleOptions {
  spiAdapter?: SpiAdapterKind;
  dictAdapter?: DictAdapterKind;
}

function spiProvider(kind: SpiAdapterKind): Provider {
  const map = {
    simulator: SpiSimulatorAdapter,
    sandbox: SpiSandboxAdapter,
    production: SpiProductionAdapter,
  } as const;
  return { provide: SPI_PORT, useClass: map[kind] };
}

function dictProvider(kind: DictAdapterKind): Provider {
  const map = {
    simulator: DictSimulatorAdapter,
    sandbox: DictSandboxAdapter,
    production: DictProductionAdapter,
  } as const;
  return { provide: DICT_PORT, useClass: map[kind] };
}

@Module({})
export class IntegrationsSpiModule {
  static register(options?: IntegrationsSpiModuleOptions): DynamicModule {
    const spiKind =
      options?.spiAdapter ??
      (process.env.INTEGRATIONS_SPI_ADAPTER as SpiAdapterKind | undefined) ??
      'simulator';
    const dictKind =
      options?.dictAdapter ??
      (process.env.INTEGRATIONS_DICT_ADAPTER as DictAdapterKind | undefined) ??
      'simulator';

    return {
      module: IntegrationsSpiModule,
      providers: [spiProvider(spiKind), dictProvider(dictKind), IntegrationsSpiService],
      exports: [IntegrationsSpiService, SPI_PORT, DICT_PORT],
    };
  }
}
`;
}

function integrationsSpiService() {
  return `import { Inject, Injectable } from '@nestjs/common';
import { DICT_PORT, DictLookupCommand, DictPort } from './ports/dict.port';
import { SPI_PORT, SpiPort, SpiTransferCommand } from './ports/spi.port';

@Injectable()
export class IntegrationsSpiService {
  constructor(
    @Inject(SPI_PORT) private readonly spi: SpiPort,
    @Inject(DICT_PORT) private readonly dict: DictPort,
  ) {}

  spiHealth() {
    return this.spi.health();
  }

  dictHealth() {
    return this.dict.health();
  }

  submitTransfer(command: SpiTransferCommand) {
    return this.spi.submitTransfer(command);
  }

  lookupKey(command: DictLookupCommand) {
    return this.dict.lookupKey(command);
  }
}
`;
}

function specFile(domain) {
  const Pascal = pascalCase(domain);
  return `import { Test } from '@nestjs/testing';
import { ${Pascal}Module } from './${domain}.module';
import { ${Pascal}Service } from './${domain}.service';

describe('${Pascal}Service (simulator)', () => {
  let service: ${Pascal}Service;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [${Pascal}Module.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(${Pascal}Service);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('${domain}');
  });

  it('executes idempotent commands', async () => {
    const command = {
      idempotencyKey: 'key-1',
      principalId: 'principal-1',
      payload: { action: 'probe' },
    };
    const first = await service.execute(command);
    const second = await service.execute(command);
    expect(first.referenceId).toBe(second.referenceId);
    expect(first.status).toBe('ACCEPTED');
  });
});
`;
}

function integrationsSpiSpec() {
  return `import { Test } from '@nestjs/testing';
import { IntegrationsSpiModule } from './integrations-spi.module';
import { IntegrationsSpiService } from './integrations-spi.service';

describe('IntegrationsSpiService (simulator)', () => {
  let service: IntegrationsSpiService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IntegrationsSpiModule.register({ spiAdapter: 'simulator', dictAdapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(IntegrationsSpiService);
  });

  it('SPI health is ok', async () => {
    const health = await service.spiHealth();
    expect(health.ok).toBe(true);
    expect(health.rail).toBe('SPI');
  });

  it('DICT lookup is contract-faithful', async () => {
    const result = await service.lookupKey({ pixKey: 'user@bank.com', requesterIspb: '12345678' });
    expect(result.found).toBe(true);
    expect(result.pixKey).toBe('user@bank.com');
  });

  it('SPI transfer is idempotent', async () => {
    const cmd = {
      idempotencyKey: 'spi-1',
      endToEndId: 'E12345678202606301200123456789',
      amountCents: '100',
      payerIspb: '12345678',
      payeeIspb: '87654321',
    };
    const a = await service.submitTransfer(cmd);
    const b = await service.submitTransfer(cmd);
    expect(a.endToEndId).toBe(b.endToEndId);
    expect(a.status).toBe('ACCEPTED');
  });
});
`;
}

function readme(domain, meta) {
  const Pascal = pascalCase(domain);
  const env = envKey(domain);
  let activation = '| Adapter | Status |\n|---------|--------|\n| simulator | **ACTIVE** (local CI) |\n| sandbox | **ACTIVE** (homolog) |\n| production | **EXTERNAL_ACTIVATION_REQUIRED** |';

  if (meta.regulatory) {
    activation = '| Adapter | Status |\n|---------|--------|\n| simulator | **ACTIVE** (local CI, flag off) |\n| sandbox | **ACTIVE** (homolog, flag off) |\n| production | **REGULATORY_ACTIVATION_REQUIRED** |\n\nFeature flags: `CRYPTO_ENABLED=false`, `CRYPTO_TRADING_LIVE=false` (see `governance/feature-flags/FEATURE-FLAGS.json`).';
  }

  let delegation = '';
  if (meta.delegate) {
    delegation = `\n## Delegation\n\nThis domain is a thin boundary over \`@regenera/core-bank\`. Do not duplicate ledger, payment, or PIX engines here — wire production adapters to core-bank modules when externally activated.\n`;
  }

  let spiNote = '';
  if (meta.spiDict && domain === 'pix') {
    spiNote = `\n## SPI / DICT\n\nPIX settlement rails are provided by \`domains/integrations-spi\` (SPI + DICT ports). Import \`IntegrationsSpiModule\` alongside \`PixModule\` for full rail coverage.\n`;
  }
  if (domain === 'integrations-spi') {
    spiNote = `\n## Rails\n\n- **SPI** — instant payment settlement (\`src/ports/spi.port.ts\`)\n- **DICT** — PIX key directory (\`src/ports/dict.port.ts\`)\n`;
  }

  return `# @regenera/${domain}

${meta.summary}

## Activation

${activation}
${delegation}${spiNote}
## Usage

\`\`\`typescript
import { ${Pascal}Module } from '@regenera/${domain}';

@Module({
  imports: [${Pascal}Module.register({ adapter: 'simulator' })],
})
export class AppModule {}
\`\`\`

Environment override: \`${env}=simulator|sandbox|production\`
`;
}

function packageJson(domain) {
  const pkg = `@regenera/${domain}`;
  const deps = {
    '@nestjs/common': '^10.4.15',
    '@nestjs/core': '^10.4.15',
    'reflect-metadata': '^0.2.2',
    rxjs: '^7.8.1',
  };
  if (DELEGATION_DOMAINS.has(domain)) {
    deps['@regenera/core-bank'] = 'workspace:*';
  }
  return {
    name: pkg,
    version: '0.0.1',
    private: true,
    license: 'UNLICENSED',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc -p tsconfig.build.json',
      lint: 'tsc --noEmit',
      test: 'jest --passWithNoTests',
    },
    dependencies: deps,
    devDependencies: {
      '@nestjs/testing': '^10.4.15',
      '@types/jest': '^29.5.14',
      '@types/node': '^20.17.10',
      jest: '^29.7.0',
      'ts-jest': '^29.2.5',
      typescript: '^5.7.2',
    },
  };
}

function tsconfig() {
  return {
    compilerOptions: {
      module: 'commonjs',
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: 'ES2021',
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      baseUrl: './',
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      esModuleInterop: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };
}

function tsconfigBuild() {
  return {
    extends: './tsconfig.json',
    exclude: ['node_modules', 'dist', '**/*spec.ts'],
  };
}

function jestConfig() {
  return `/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\\\.spec\\\\.ts$',
  transform: {
    '^.+\\\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
};
`;
}

function indexFile(domain) {
  const Pascal = pascalCase(domain);
  return `export * from './ports/${domain}.port';
export * from './${domain}.module';
export * from './${domain}.service';
export { ${Pascal}SimulatorAdapter } from './adapters/simulator/${domain}-simulator.adapter';
export { ${Pascal}SandboxAdapter } from './adapters/sandbox/${domain}-sandbox.adapter';
export { ${Pascal}ProductionAdapter } from './adapters/production/${domain}-production.adapter';
`;
}

function integrationsSpiIndex() {
  return `export * from './ports/spi.port';
export * from './ports/dict.port';
export * from './integrations-spi.module';
export * from './integrations-spi.service';
`;
}

function scaffoldDomain(meta) {
  const { name: domain } = meta;
  const base = path.join(DOMAINS_DIR, domain);
  const created = [];

  const files = [
    [path.join(base, 'package.json'), JSON.stringify(packageJson(domain), null, 2) + '\n'],
    [path.join(base, 'tsconfig.json'), JSON.stringify(tsconfig(), null, 2) + '\n'],
    [path.join(base, 'tsconfig.build.json'), JSON.stringify(tsconfigBuild(), null, 2) + '\n'],
    [path.join(base, 'jest.config.js'), jestConfig()],
    [path.join(base, 'src', 'ports', `${domain}.port.ts`), portFile(domain, meta)],
    [
      path.join(base, 'src', 'adapters', 'production', `${domain}-production.adapter.ts`),
      adapterFile(domain, meta, 'production'),
    ],
    [
      path.join(base, 'src', 'adapters', 'sandbox', `${domain}-sandbox.adapter.ts`),
      adapterFile(domain, meta, 'sandbox'),
    ],
    [
      path.join(base, 'src', 'adapters', 'simulator', `${domain}-simulator.adapter.ts`),
      adapterFile(domain, meta, 'simulator'),
    ],
    [path.join(base, 'src', `${domain}.service.ts`), serviceFile(domain, meta)],
    [path.join(base, 'src', `${domain}.module.ts`), moduleFile(domain)],
    [path.join(base, 'src', `${domain}.spec.ts`), specFile(domain)],
    [path.join(base, 'README.md'), readme(domain, meta)],
    [path.join(base, 'src', 'index.ts'), indexFile(domain)],
  ];

  if (domain === 'integrations-spi') {
    const { spiPort, dictPort } = spiDictPortFiles();
    files.push(
      [path.join(base, 'src', 'ports', 'spi.port.ts'), spiPort],
      [path.join(base, 'src', 'ports', 'dict.port.ts'), dictPort],
      [path.join(base, 'src', 'adapters', 'production', 'spi-production.adapter.ts'), spiAdapterFile('spi', 'production')],
      [path.join(base, 'src', 'adapters', 'production', 'dict-production.adapter.ts'), spiAdapterFile('dict', 'production')],
      [path.join(base, 'src', 'adapters', 'sandbox', 'spi-sandbox.adapter.ts'), spiAdapterFile('spi', 'sandbox')],
      [path.join(base, 'src', 'adapters', 'sandbox', 'dict-sandbox.adapter.ts'), spiAdapterFile('dict', 'sandbox')],
      [path.join(base, 'src', 'adapters', 'simulator', 'spi-simulator.adapter.ts'), spiAdapterFile('spi', 'simulator')],
      [path.join(base, 'src', 'adapters', 'simulator', 'dict-simulator.adapter.ts'), spiAdapterFile('dict', 'simulator')],
      [path.join(base, 'src', 'integrations-spi.service.ts'), integrationsSpiService()],
      [path.join(base, 'src', 'integrations-spi.module.ts'), integrationsSpiModule()],
      [path.join(base, 'src', 'integrations-spi.spec.ts'), integrationsSpiSpec()],
      [path.join(base, 'src', 'index.ts'), integrationsSpiIndex()],
    );
    // Remove generic port for integrations-spi - use spi/dict only
    files.splice(
      files.findIndex(([p]) => p.endsWith(`${domain}.port.ts`)),
      1,
    );
    files.splice(
      files.findIndex(([p]) => p.includes('production') && p.endsWith(`${domain}-production.adapter.ts`)),
      1,
    );
    files.splice(
      files.findIndex(([p]) => p.includes('sandbox') && p.endsWith(`${domain}-sandbox.adapter.ts`)),
      1,
    );
    files.splice(
      files.findIndex(([p]) => p.includes('simulator') && p.endsWith(`${domain}-simulator.adapter.ts`)),
      1,
    );
    files.splice(
      files.findIndex(([p]) => p.endsWith(`${domain}.service.ts`)),
      1,
    );
    files.splice(
      files.findIndex(([p]) => p.endsWith(`${domain}.module.ts`)),
      1,
    );
    files.splice(
      files.findIndex(([p]) => p.endsWith(`${domain}.spec.ts`)),
      1,
    );
  }

  for (const [filePath, content] of files) {
    if (writeFile(filePath, content)) {
      created.push(path.relative(ROOT, filePath));
    }
  }

  return created;
}

function main() {
  let totalCreated = 0;
  const allCreated = [];

  for (const meta of DOMAIN_CATALOG) {
    const created = scaffoldDomain(meta);
    totalCreated += created.length;
    allCreated.push(...created);
    console.log(`[${meta.name}] ${created.length} files created`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    domainCount: DOMAIN_CATALOG.length,
    domains: DOMAIN_CATALOG.map((d) => d.name),
    filesCreated: totalCreated,
  };
  const manifestPath = path.join(ROOT, 'domains', 'SCAFFOLD-MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nTotal: ${DOMAIN_CATALOG.length} domains, ${totalCreated} new files`);
  console.log(`Manifest: ${path.relative(ROOT, manifestPath)}`);
}

main();