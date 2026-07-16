/**
 * CLM-012 — contrato KYC: documentContent canônico + alias fileBase64/selfieBase64 legado.
 */
import { resolveDocumentContent, resolveSelfieContent } from './onboarding-kyc-contract';

describe('onboarding KYC contract aliases', () => {
  it('documentContent canônico tem prioridade', () => {
    expect(
      resolveDocumentContent({
        documentContent: 'canonical',
        fileBase64: 'legacy',
      }),
    ).toBe('canonical');
  });

  it('fileBase64 aceito quando documentContent ausente', () => {
    expect(resolveDocumentContent({ fileBase64: 'legacy-doc' })).toBe('legacy-doc');
  });

  it('selfieContent canônico tem prioridade', () => {
    expect(
      resolveSelfieContent({
        selfieContent: 'canonical-selfie',
        selfieBase64: 'legacy-selfie',
      }),
    ).toBe('canonical-selfie');
  });

  it('selfieBase64 aceito quando selfieContent ausente', () => {
    expect(resolveSelfieContent({ selfieBase64: 'legacy-selfie' })).toBe(
      'legacy-selfie',
    );
  });
});