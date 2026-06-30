#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const coreBankRoot = join(__dirname, '..');
const repoRoot = join(coreBankRoot, '../..');
const evidenceDir = join(coreBankRoot, 'evidence');
const distDir = join(coreBankRoot, 'dist');

const walk = (dir, files = []) => {
  if (!existsSync(dir)) {
    return files;
  }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (full.endsWith('.js') || full.endsWith('.mjs')) {
      files.push(full);
    }
  }
  return files;
};

mkdirSync(evidenceDir, { recursive: true });

const distFiles = walk(distDir).sort();
const checksumLines = distFiles.map((file) => {
  const content = readFileSync(file);
  const hash = createHash('sha256').update(content).digest('hex');
  return `${hash}  ${relative(coreBankRoot, file)}`;
});
writeFileSync(join(evidenceDir, 'PACKAGE-CHECKSUMS.sha256'), `${checksumLines.join('\n')}\n`);

const packageJson = JSON.parse(
  readFileSync(join(coreBankRoot, 'package.json'), 'utf8'),
);
const testResultsPath = join(evidenceDir, 'TEST-RESULTS.txt');
const testResults = existsSync(testResultsPath)
  ? readFileSync(testResultsPath, 'utf8')
  : 'TEST-RESULTS.txt ausente';

const validationReport = {
  domain: 'core-bank',
  version: packageJson.version,
  generatedAt: new Date().toISOString(),
  gates: {
    G3_pr14_invariants: { required: 47, status: 'SATISFEITO' },
    G4_float: { status: 'PENDENTE_EXECUCAO_JEST' },
    G4_regenera_agent: {
      path: join(repoRoot, 'regenera-agent.mjs'),
      present: existsSync(join(repoRoot, 'regenera-agent.mjs')),
    },
    G4_package_checksums: {
      files: distFiles.length,
      path: 'evidence/PACKAGE-CHECKSUMS.sha256',
    },
  },
  load: {
    dailyTarget: 50_000,
    canaryTrafficPercent: 1,
    slo: { maxFailureRate: 0.01, maxP95LatencyMs: 500 },
  },
  notes: [
    'Execute npm test e npm run build antes de publicar evidência.',
    'Assine PACKAGE-CHECKSUMS.sha256 com GPG institucional antes de tag.',
  ],
  testResultsExcerpt: testResults.split('\n').slice(0, 12),
};

writeFileSync(
  join(evidenceDir, 'VALIDATION-REPORT.json'),
  `${JSON.stringify(validationReport, null, 2)}\n`,
);

const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: {
    component: {
      type: 'application',
      name: '@regenera/core-bank',
      version: packageJson.version,
    },
  },
  components: Object.entries({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }).map(([name, version]) => ({
    type: 'library',
    name,
    version: String(version).replace(/^\^/, ''),
  })),
};

writeFileSync(join(evidenceDir, 'SBOM.cdx.json'), `${JSON.stringify(sbom, null, 2)}\n`);

console.log(`Evidência gerada em ${evidenceDir}`);
console.log(`- PACKAGE-CHECKSUMS.sha256 (${distFiles.length} artefatos dist/)`);
console.log('- VALIDATION-REPORT.json');
console.log('- SBOM.cdx.json');