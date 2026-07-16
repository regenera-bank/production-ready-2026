import {
  allowedActionsForState,
  mapOnboardingToJourneyState,
} from './journey-state.mapper';

describe('journey-state.mapper', () => {
  it('mapeia cadastral pendente para PERSONAL_DATA_PENDING', () => {
    expect(
      mapOnboardingToJourneyState({
        kycStatus: 'PENDING',
        kycStep: 'cadastral',
        accountStatus: 'NONE',
      }),
    ).toBe('PERSONAL_DATA_PENDING');
  });

  it('mapeia documento para DOCUMENTS_PENDING', () => {
    expect(
      mapOnboardingToJourneyState({
        kycStatus: 'IN_REVIEW',
        kycStep: 'document',
        accountStatus: 'NONE',
      }),
    ).toBe('DOCUMENTS_PENDING');
  });

  it('mapeia conta ativa para COMPLETED', () => {
    expect(
      mapOnboardingToJourneyState({
        kycStatus: 'APPROVED',
        kycStep: 'done',
        accountStatus: 'ACTIVE',
      }),
    ).toBe('COMPLETED');
  });

  it('expõe ações permitidas por estado', () => {
    expect(allowedActionsForState('DOCUMENTS_PENDING')).toContain('POST_DOCUMENTS');
    expect(allowedActionsForState('KYC_PROCESSING')).not.toContain('POST_DOCUMENTS');
  });
});