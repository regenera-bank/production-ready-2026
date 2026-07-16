import {
  collectLivenessWarnings,
  mapLivenessWarningsToReason,
  resolveDiditLivenessMethod,
  resolveKycFromDiditSession,
} from './didit-liveness.mapper';

describe('didit-liveness.mapper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('default liveness method is ACTIVE_3D for banking', () => {
    delete process.env.DIDIT_LIVENESS_METHOD;
    expect(resolveDiditLivenessMethod()).toBe('ACTIVE_3D');
  });

  it('honors DIDIT_LIVENESS_METHOD override', () => {
    process.env.DIDIT_LIVENESS_METHOD = 'FLASHING';
    expect(resolveDiditLivenessMethod()).toBe('FLASHING');
  });

  it('maps liveness attack to DIDIT_LIVENESS_ATTACK on decline', () => {
    const mapped = resolveKycFromDiditSession('Declined', {
      liveness_checks: [
        {
          status: 'Declined',
          warnings: ['LIVENESS_FACE_ATTACK'],
        },
      ],
    });
    expect(mapped.kycStatus).toBe('REJECTED');
    expect(mapped.kycReason).toBe('DIDIT_LIVENESS_ATTACK');
  });

  it('maps duplicate face to manual review reason when in review', () => {
    const mapped = resolveKycFromDiditSession('In Review', {
      liveness_checks: [
        {
          status: 'In Review',
          warnings: ['DUPLICATED_FACE'],
        },
      ],
    });
    expect(mapped.kycStep).toBe('manual_review');
    expect(mapped.kycReason).toBe('DIDIT_DUPLICATE_FACE');
  });

  it('prioritizes attack over low score warnings', () => {
    const reason = mapLivenessWarningsToReason(
      collectLivenessWarnings([
        { warnings: ['LOW_LIVENESS_SCORE', 'LIVENESS_FACE_ATTACK'] },
      ]),
    );
    expect(reason).toBe('DIDIT_LIVENESS_ATTACK');
  });
});