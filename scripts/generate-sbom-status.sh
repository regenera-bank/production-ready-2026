#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/sbom/final"

python3 <<PY
import json, os, glob
from datetime import datetime, timezone

names = [
  "core-bank", "web-bff", "outbox-relay", "web-banking", "mobile-bff",
  "operations-bff", "partner-api-facade", "partner-developer-portal",
  "design-web", "e2e-web"
]
out_dir = "$OUT"
components = []
for name in names:
    full = os.path.join(out_dir, f"sbom-{name}.json")
    partial = os.path.join(out_dir, f"sbom-{name}.PARTIAL_DECLARED_DEPENDENCIES_ONLY.json")
    err = os.path.join(out_dir, f"sbom-{name}.err.log")
    classification = "FAILED"
    file = ""
    reason = ""
    direct = []
    transitive = False
    if os.path.isfile(full) and os.path.getsize(full) > 0:
        data = json.load(open(full))
        comps = data.get("components", [])
        if len(comps) > 5:
            classification = "COMPLETE_TRANSITIVE"
            file = f"sbom-{name}.json"
            transitive = True
        else:
            classification = "PARTIAL_DECLARED_DEPENDENCIES_ONLY"
            file = f"sbom-{name}.json"
            reason = "cyclonedx output below transitive threshold"
            direct = [c.get("name") for c in comps[:20]]
    elif os.path.isfile(partial):
        classification = "PARTIAL_DECLARED_DEPENDENCIES_ONLY"
        file = f"sbom-{name}.PARTIAL_DECLARED_DEPENDENCIES_ONLY.json"
        reason = open(err).readline().strip() if os.path.isfile(err) else "toolchain limitation"
        data = json.load(open(partial))
        direct = [c.get("name") for c in data.get("components", [])[:20]]
    else:
        reason = "no SBOM artifact generated"
    components.append({
        "component": name,
        "status": classification,
        "file": file,
        "reason": reason,
        "directDependenciesCovered": direct,
        "transitiveDependenciesCovered": transitive,
        "risk": "low" if transitive else "supply-chain visibility gap",
        "remediation": "none" if transitive else "regenerate with cyclonedx-npm after lockfile reconcile"
    })

status = {
    "generatedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "components": components
}
json.dump(status, open(os.path.join(out_dir, "SBOM-STATUS.json"), "w"), indent=2)
print("SBOM-STATUS.json written")
PY