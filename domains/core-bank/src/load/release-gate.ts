import { existsSync } from 'fs';
import { join } from 'path';
import { CANARY_GATE_CONFIG } from './canary-gate.config';
import { scanFloatViolations } from './float-guard';

export interface ReleaseGateCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface ReleaseGateReport {
  readonly passed: boolean;
  readonly checks: readonly ReleaseGateCheck[];
  readonly generatedAt: string;
}

export interface ReleaseGateOptions {
  readonly srcRoot: string;
  readonly repoRoot: string;
  readonly invariantCount?: number;
}

export const evaluateReleaseGate = (
  options: ReleaseGateOptions,
): ReleaseGateReport => {
  const invariantCount = options.invariantCount ?? CANARY_GATE_CONFIG.invariantCount;
  const floatViolations = scanFloatViolations(options.srcRoot);
  const regeneraAgentPath = join(options.repoRoot, 'regenera-agent.mjs');
  const checksumsPath = join(options.repoRoot, 'domains/core-bank/evidence/PACKAGE-CHECKSUMS.sha256');
  const validationPath = join(options.repoRoot, 'domains/core-bank/evidence/VALIDATION-REPORT.json');

  const checks: ReleaseGateCheck[] = [
    {
      id: 'G4-FLOAT',
      passed: floatViolations.length === 0,
      detail:
        floatViolations.length === 0
          ? '0 ocorrências float/parseFloat em caminhos monetários'
          : `${floatViolations.length} violação(ões) float detectada(s)`,
    },
    {
      id: 'G4-INVARIANTS',
      passed: invariantCount === CANARY_GATE_CONFIG.invariantCount,
      detail: `${invariantCount}/${CANARY_GATE_CONFIG.invariantCount} invariantes registrados`,
    },
    {
      id: 'G4-CANARY',
      passed: CANARY_GATE_CONFIG.canaryTrafficPercent === 1,
      detail: `canário ${CANARY_GATE_CONFIG.canaryTrafficPercent}% com flags default false`,
    },
    {
      id: 'G4-REGENERA-AGENT',
      passed: existsSync(regeneraAgentPath),
      detail: existsSync(regeneraAgentPath)
        ? 'regenera-agent.mjs presente no repositório'
        : 'regenera-agent.mjs ausente',
    },
    {
      id: 'G4-PACKAGE-CHECKSUMS',
      passed: existsSync(checksumsPath),
      detail: existsSync(checksumsPath)
        ? 'PACKAGE-CHECKSUMS.sha256 gerado'
        : 'PACKAGE-CHECKSUMS.sha256 pendente — rode npm run evidence:generate',
    },
    {
      id: 'G4-VALIDATION-REPORT',
      passed: existsSync(validationPath),
      detail: existsSync(validationPath)
        ? 'VALIDATION-REPORT.json presente'
        : 'VALIDATION-REPORT.json pendente — rode npm run evidence:generate',
    },
  ];

  return {
    passed: checks.every((check) => check.passed),
    checks,
    generatedAt: new Date().toISOString(),
  };
};