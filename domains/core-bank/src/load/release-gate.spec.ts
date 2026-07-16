import { join } from 'path';
import { CANARY_GATE_CONFIG } from './canary-gate.config';
import { evaluateReleaseGate } from './release-gate';

describe('Release gate G4 (PR-15)', () => {
  const srcRoot = join(__dirname, '..');
  const repoRoot = join(__dirname, '../../../..');

  it('valida invariantes e canário 1%', () => {
    const report = evaluateReleaseGate({
      srcRoot,
      repoRoot,
      invariantCount: CANARY_GATE_CONFIG.invariantCount,
    });
    const invariantCheck = report.checks.find((c) => c.id === 'G4-INVARIANTS');
    const canaryCheck = report.checks.find((c) => c.id === 'G4-CANARY');
    const floatCheck = report.checks.find((c) => c.id === 'G4-FLOAT');
    expect(invariantCheck?.passed).toBe(true);
    expect(canaryCheck?.passed).toBe(true);
    expect(floatCheck?.passed).toBe(true);
  });

  it('exige artefatos de evidência para gate completo', () => {
    const report = evaluateReleaseGate({ srcRoot, repoRoot });
    const checksums = report.checks.find((c) => c.id === 'G4-PACKAGE-CHECKSUMS');
    const validation = report.checks.find((c) => c.id === 'G4-VALIDATION-REPORT');
    expect(checksums).toBeDefined();
    expect(validation).toBeDefined();
  });
});