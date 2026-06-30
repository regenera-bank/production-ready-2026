/**
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
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
