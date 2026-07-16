import { Injectable, Logger } from '@nestjs/common';
import type { VisionAdapter, VisionFaceResult, VisionTextResult } from './vision.adapter';

const homologKycEnabled = (): boolean => {
  const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
  return provider === 'firebase' || provider === 'homolog';
};

const isVisionTransportError = (error: unknown): boolean => {
  const message =
    error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  return (
    lower.includes('403') ||
    lower.includes('401') ||
    lower.includes('permission_denied') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid_rapt') ||
    lower.includes('reauth') ||
    lower.includes('adc sem token') ||
    lower.includes('blocked') ||
    lower.includes('unauthenticated')
  );
};

/**
 * Homolog: tenta Vision GCP real (ADC ou API key); se credencial expirou,
 * usa sandbox Auditável (mesmo contrato dos testes E2E) para não travar o canal.
 */
@Injectable()
export class ResilientVisionAdapter implements VisionAdapter {
  private readonly logger = new Logger(ResilientVisionAdapter.name);
  private warned = false;

  constructor(
    private readonly primary: VisionAdapter,
    private readonly homologSandbox: VisionAdapter,
  ) {}

  private shouldUseSandbox(error: unknown): boolean {
    return homologKycEnabled() && isVisionTransportError(error);
  }

  private warnOnce(detail: string): void {
    if (this.warned) return;
    this.warned = true;
    this.logger.warn(
      `[homolog] Vision GCP indisponível (${detail}) — sandbox KYC ativo. ` +
        'Para OCR real: gcloud auth application-default login',
    );
  }

  private async withFallback<T>(
    op: (adapter: VisionAdapter) => Promise<T>,
  ): Promise<T> {
    try {
      return await op(this.primary);
    } catch (error) {
      if (!this.shouldUseSandbox(error)) {
        throw error;
      }
      this.warnOnce(error instanceof Error ? error.message : String(error));
      return op(this.homologSandbox);
    }
  }

  extractText(buffer: Buffer): Promise<VisionTextResult> {
    return this.withFallback((a) => a.extractText(buffer));
  }

  detectFaces(buffer: Buffer): Promise<VisionFaceResult> {
    return this.withFallback((a) => a.detectFaces(buffer));
  }

  detectLabels(buffer: Buffer): Promise<readonly string[]> {
    return this.withFallback((a) => a.detectLabels(buffer));
  }
}