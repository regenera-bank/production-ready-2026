/**
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
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
