#!/usr/bin/env bash
# Generate SBOM — cyclonedx preferred; fallback manifest from package.json for file: monorepo links.
set -euo pipefail
out="${1:?output file required}"
if npx --yes @cyclonedx/cyclonedx-npm --package-lock-only --output-file "$out" 2>/dev/null; then
  exit 0
fi
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const components = Object.entries(deps).map(([name, version]) => ({
  type: 'library',
  name,
  version: String(version).replace(/^[^0-9]*/, '') || '0.0.0',
}));
const bom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: { component: { type: 'application', name: pkg.name, version: pkg.version } },
  components,
  properties: [{ name: 'regenera:sbom:fallback', value: 'package.json-manifest' }],
};
fs.writeFileSync(process.argv[1], JSON.stringify(bom, null, 2));
console.log('SBOM fallback manifest:', components.length, 'components');
" "$out"