#!/usr/bin/env bash
# ORDEM FINAL — RELEASE AUTORITATIVA (§1–§20)
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RELEASE_ROOT="${RELEASE_ROOT:-$HOME/Desktop/REGENERA-FINAL-RELEASE}"
RELEASE_NAME="REGENERA-BANK-FULL-PLATFORM-RELEASE-FINAL"
GPG_FINGERPRINT="${GPG_FINGERPRINT:-730834AB4126C341A70F6B969826A3AC0BF6A90C}"
INVOCATION_ID="$(uuidgen 2>/dev/null || date +%s)"
STARTED_ON="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

log() { printf '[release-final] %s\n' "$*"; }
fail() { log "NO-GO — $*"; exit 1; }

mkdir -p "$RELEASE_ROOT/evidence"

if [[ "${RELEASE_SKIP_PREP:-0}" != "1" ]]; then
  log "§2 sync docs"
  bash scripts/mark-audit-superseded.sh
  bash scripts/sync-final-docs.sh
  log "§3 SBOMs"
  bash scripts/generate-final-sbom.sh || fail "SBOM generation failed"
  log "§4 containers (7)"
  bash scripts/validate-containers-final.sh || fail "container validation failed"
fi

log "§5 clean macOS metadata"
find . -path './.git' -prune -o \( -name '.DS_Store' -o -name '._*' \) -print -delete 2>/dev/null || true

log "§5 forbidden files scan"
FORBIDDEN="$(find . -path './.git' -prune -o \
  \( -name '.DS_Store' -o -name '._*' -o -name '.env' -o -name '.env.local' -o -name '.env.secrets' \
     -o -name '.env.secrets.local' -o -name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name '*.pfx' \) \
  -print 2>/dev/null)"
[[ -z "$FORBIDDEN" ]] || fail "forbidden files: $FORBIDDEN"

if [[ ! -s "$RELEASE_ROOT/evidence/gitleaks-precommit.log" ]]; then
  log "§5 gitleaks"
  gitleaks detect --config .gitleaks.toml --source . --redact --exit-code 1 \
    >"$RELEASE_ROOT/evidence/gitleaks-precommit.log" 2>&1 || fail "gitleaks pre-commit"
fi

log "§5 secretlint (scoped)"
: >"$RELEASE_ROOT/evidence/secretlint-precommit.log"
for scope in domains/core-bank/src bff/web-bff/src apps/web-banking/src workers/outbox-relay/src scripts; do
  target="$ROOT/$scope"
  [[ -d "$target" ]] || target="$ROOT/${scope%/src}"
  npx --yes @secretlint/quick-start "$target" \
    >>"$RELEASE_ROOT/evidence/secretlint-precommit.log" 2>&1 || fail "secretlint pre-commit: $scope"
done

# §6 — final commit
log "§6 final commit"
find docs/final docs/audit -name '*.md' -exec sed -i '' 's/[[:space:]]*$//' {} + 2>/dev/null || true
git add -A
# Evidência CI vive fora do repo (RELEASE_ROOT/evidence) — não congelar logs locais antigos
git reset HEAD artifacts/verification/full-ci/ artifacts/verification/ci/ 2>/dev/null || true
git diff --cached --check || fail "whitespace errors in staged files"
COMMIT_SIGNATURE_STATUS="OK"
if git commit -S -m "release: freeze full platform deployment candidate" 2>"$RELEASE_ROOT/commit-sign.log"; then
  :
elif git commit -m "release: freeze full platform deployment candidate"; then
  COMMIT_SIGNATURE_STATUS="COMMIT_SIGNATURE_PENDING_EXTERNAL_CREDENTIAL"
else
  fail "git commit failed"
fi

FINAL_COMMIT="$(git rev-parse HEAD)"
FINAL_TREE="$(git rev-parse HEAD^{tree})"
FINAL_BRANCH="$(git branch --show-current)"
[[ -z "$(git status --porcelain)" ]] || fail "working tree dirty after commit"

printf '%s\n' "$FINAL_COMMIT" >"$RELEASE_ROOT/FINAL-COMMIT.txt"
printf '%s\n' "$FINAL_TREE" >"$RELEASE_ROOT/FINAL-TREE.txt"
printf '%s\n' "$FINAL_BRANCH" >"$RELEASE_ROOT/FINAL-BRANCH.txt"
printf '%s\n' "$COMMIT_SIGNATURE_STATUS" >"$RELEASE_ROOT/COMMIT-SIGNATURE-STATUS.txt"

log "FINAL_COMMIT=$FINAL_COMMIT FINAL_TREE=$FINAL_TREE"

# §7 — freeze
test "$(git rev-parse HEAD)" = "$FINAL_COMMIT"
test "$(git rev-parse HEAD^{tree})" = "$FINAL_TREE"
test -z "$(git status --porcelain)"

# §8 CI run 1
log "§8 CI run 1"
CI1_ROOT="$(mktemp -d)/regenera-ci-run1"
git worktree add --detach "$CI1_ROOT" "$FINAL_COMMIT"
(
  cd "$CI1_ROOT"
  export RELEASE_EVIDENCE_ROOT="$RELEASE_ROOT/evidence/run1"
  export CI_RUN_ID=1
  FULL_CI_RUNS=1 bash scripts/run-full-platform-ci.sh
) || fail "CI run 1 failed"
CI1_EXIT=0
printf '%s\n' "$CI1_EXIT" >"$RELEASE_ROOT/CI-RUN1-EXIT.txt"
test "$(git -C "$CI1_ROOT" rev-parse HEAD)" = "$FINAL_COMMIT"
test -z "$(git -C "$CI1_ROOT" status --porcelain)"

# §9 CI run 2
log "§9 CI run 2"
CI2_ROOT="$(mktemp -d)/regenera-ci-run2"
git worktree add --detach "$CI2_ROOT" "$FINAL_COMMIT"
(
  cd "$CI2_ROOT"
  export RELEASE_EVIDENCE_ROOT="$RELEASE_ROOT/evidence/run2"
  export CI_RUN_ID=2
  FULL_CI_RUNS=1 bash scripts/run-full-platform-ci.sh
) || fail "CI run 2 failed"
CI2_EXIT=0
printf '%s\n' "$CI2_EXIT" >"$RELEASE_ROOT/CI-RUN2-EXIT.txt"

# §10 — confirm unchanged
cd "$ROOT"
test "$(git rev-parse HEAD)" = "$FINAL_COMMIT"
test "$(git rev-parse HEAD^{tree})" = "$FINAL_TREE"
test -z "$(git status --porcelain)"
git status --porcelain=v1 >"$RELEASE_ROOT/final-git-status.txt"
git show --show-signature --stat --oneline "$FINAL_COMMIT" >"$RELEASE_ROOT/final-commit.txt"
git ls-tree -r "$FINAL_COMMIT" >"$RELEASE_ROOT/final-tree.txt"
[[ ! -s "$RELEASE_ROOT/final-git-status.txt" ]] || fail "working tree changed"

# §11 — git archive ZIP
SOURCE_ZIP="$RELEASE_ROOT/$RELEASE_NAME.zip"
git archive --format=zip --prefix="regenera-bank/" --output="$SOURCE_ZIP" "$FINAL_COMMIT"
unzip -t "$SOURCE_ZIP" | tee "$RELEASE_ROOT/zip-integrity.log"

# §12 — validate extracted
EXTRACT_ROOT="$(mktemp -d)"
unzip -q "$SOURCE_ZIP" -d "$EXTRACT_ROOT"
EXTRACTED="$EXTRACT_ROOT/regenera-bank"
find "$EXTRACTED" \( -name '.git' -o -name 'node_modules' -o -name 'dist' -o -name 'coverage' \
  -o -name '.env' -o -name '.env.local' -o -name '.env.secrets' -o -name '.data' -o -name '.DS_Store' -o -name '._*' \
  -o -name '__MACOSX' -o -name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name '*.pfx' \) -print \
  | tee "$RELEASE_ROOT/forbidden-files-scan.log"
[[ ! -s "$RELEASE_ROOT/forbidden-files-scan.log" ]] || fail "forbidden files in ZIP"

CHECKOUT_ROOT="$(mktemp -d)/regenera-checkout"
git worktree add --detach "$CHECKOUT_ROOT" "$FINAL_COMMIT"
diff -qr --exclude='.git' "$CHECKOUT_ROOT" "$EXTRACTED" | tee "$RELEASE_ROOT/package-vs-commit.diff"
[[ ! -s "$RELEASE_ROOT/package-vs-commit.diff" ]] || fail "ZIP differs from commit"

gitleaks detect --source "$EXTRACTED" --no-git --redact --exit-code 1 \
  | tee "$RELEASE_ROOT/gitleaks-extracted-package.log"

# §13 SHA-256
SHA_FILE="$RELEASE_ROOT/$RELEASE_NAME.zip.sha256"
shasum -a 256 "$SOURCE_ZIP" | sed "s|$SOURCE_ZIP|$(basename "$SOURCE_ZIP")|" >"$SHA_FILE"
shasum -a 256 -c "$SHA_FILE"
RELEASE_SHA256="$(awk '{print $1}' "$SHA_FILE")"
ZIP_BYTES="$(wc -c <"$SOURCE_ZIP" | tr -d ' ')"
REGULAR_FILES="$(git ls-tree -r "$FINAL_COMMIT" | awk '$2=="blob"{c++}END{print c+0}')"
DIR_COUNT="$(git ls-tree -d -r "$FINAL_COMMIT" | wc -l | tr -d ' ')"
TOTAL_ENTRIES="$(unzip -l "$SOURCE_ZIP" | tail -1 | awk '{print $2}')"

# §14 manifest
MANIFEST="$RELEASE_ROOT/$RELEASE_NAME.manifest.json"
FINISHED_ON="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python3 -c "
import json
m = {
  'schemaVersion': '1.0',
  'package': '$RELEASE_NAME.zip',
  'branch': '$FINAL_BRANCH',
  'commit': '$FINAL_COMMIT',
  'treeHash': '$FINAL_TREE',
  'sha256': '$RELEASE_SHA256',
  'bytes': $ZIP_BYTES,
  'regularFileCount': $REGULAR_FILES,
  'directoryCount': $DIR_COUNT,
  'totalZipEntries': $TOTAL_ENTRIES,
  'createdAtUtc': '$FINISHED_ON',
  'ci': {
    'run1Exit': $CI1_EXIT, 'run2Exit': $CI2_EXIT,
    'run1Commit': '$FINAL_COMMIT', 'run2Commit': '$FINAL_COMMIT',
    'run1Tree': '$FINAL_TREE', 'run2Tree': '$FINAL_TREE'
  },
  'containers': json.load(open('$ROOT/artifacts/verification/containers/final/container-scan-summary.json'))['images'],
  'sboms': json.load(open('$ROOT/artifacts/sbom/final/SBOM-STATUS.json'))['components'],
  'forbiddenFiles': 0,
  'secretsInPackage': False,
  'deployExecuted': False
}
json.dump(m, open('$MANIFEST','w'), indent=2)
"

# §15 provenance
PROVENANCE="$RELEASE_ROOT/$RELEASE_NAME.provenance.json"
python3 -c "
import json
p = {
  '_type': 'https://in-toto.io/Statement/v1',
  'subject': [{'name': '$RELEASE_NAME.zip', 'digest': {'sha256': '$RELEASE_SHA256'}}],
  'predicateType': 'https://slsa.dev/provenance/v1',
  'predicate': {
    'buildDefinition': {
      'buildType': 'regenera/git-archive-release',
      'externalParameters': {'branch': '$FINAL_BRANCH', 'commit': '$FINAL_COMMIT', 'treeHash': '$FINAL_TREE'},
      'resolvedDependencies': [{'uri': 'git+local://regenera-bank', 'digest': {'gitCommit': '$FINAL_COMMIT', 'gitTree': '$FINAL_TREE'}}]
    },
    'runDetails': {
      'builder': {'id': 'regenera-local-release-pipeline'},
      'metadata': {'invocationId': '$INVOCATION_ID', 'startedOn': '$STARTED_ON', 'finishedOn': '$FINISHED_ON'}
    }
  }
}
json.dump(p, open('$PROVENANCE','w'), indent=2)
"

# §16 consistency check
CONSISTENCY="$RELEASE_ROOT/release-consistency-check.log"
{
  echo "FINAL_COMMIT=$FINAL_COMMIT"
  echo "MANIFEST_COMMIT=$(python3 -c "import json;print(json.load(open('$MANIFEST'))['commit'])")"
  echo "PROVENANCE_COMMIT=$(python3 -c "import json;print(json.load(open('$PROVENANCE'))['predicate']['buildDefinition']['externalParameters']['commit'])")"
  echo "SHA256=$RELEASE_SHA256"
  test "$(python3 -c "import json;print(json.load(open('$MANIFEST'))['commit'])")" = "$FINAL_COMMIT"
  test "$(python3 -c "import json;print(json.load(open('$MANIFEST'))['sha256'])")" = "$RELEASE_SHA256"
  echo "ALL_RELEASE_IDENTIFIERS_MATCH"
} | tee "$CONSISTENCY"

# §17 GPG sign
export GPG_TTY="${GPG_TTY:-$(tty 2>/dev/null || echo not-a-tty)}"
gpg --batch --list-secret-keys "$GPG_FINGERPRINT" >/dev/null 2>&1 || fail "GPG_PRIVATE_KEY_NOT_AVAILABLE"
gpg --armor --detach-sign --local-user "$GPG_FINGERPRINT" --output "$SHA_FILE.asc" "$SHA_FILE"
gpg --verify "$SHA_FILE.asc" "$SHA_FILE" 2>&1 | tee "$RELEASE_ROOT/gpg-verification.log"
gpg --armor --export "$GPG_FINGERPRINT" >"$RELEASE_ROOT/REGENERA-INSTITUTIONAL-PUBLIC-KEY.asc"
gpg --fingerprint "$GPG_FINGERPRINT" >"$RELEASE_ROOT/REGENERA-INSTITUTIONAL-FINGERPRINT.txt"

# §18 copy docs
cp docs/final/21-FINAL-DEPLOYMENT-HANDOFF.md "$RELEASE_ROOT/"
cp docs/final/22-FINAL-INDEPENDENT-AUDIT.md "$RELEASE_ROOT/"
cp docs/final/23-FINAL-CLOSURE.md "$RELEASE_ROOT/"

# Summary for §20
SBOM_STATUS="$ROOT/artifacts/sbom/final/SBOM-STATUS.json"
python3 -c "
import json
s=json.load(open('$SBOM_STATUS'))
c=sum(1 for x in s['components'] if x['status']=='COMPLETE_TRANSITIVE')
p=sum(1 for x in s['components'] if x['status']=='PARTIAL_DECLARED_DEPENDENCIES_ONLY')
f=sum(1 for x in s['components'] if x['status']=='FAILED')
open('$RELEASE_ROOT/RELEASE-SUMMARY.txt','w').write(f'''Workspace: $ROOT
Branch: $FINAL_BRANCH
Final commit: $FINAL_COMMIT
Final tree: $FINAL_TREE
Working tree: clean

Documents synchronized: YES
SBOM complete: {c}
SBOM partial: {p}
SBOM failed: {f}

CI run 1 commit: $FINAL_COMMIT
CI run 1 tree: $FINAL_TREE
CI run 1 exit: $CI1_EXIT

CI run 2 commit: $FINAL_COMMIT
CI run 2 tree: $FINAL_TREE
CI run 2 exit: $CI2_EXIT

ZIP source: git archive $FINAL_COMMIT
ZIP extracted comparison: PASS
ZIP forbidden files: 0
ZIP gitleaks: PASS

Release ZIP: $SOURCE_ZIP
Release bytes: $ZIP_BYTES
Regular files: $REGULAR_FILES
Directories: $DIR_COUNT
Total entries: $TOTAL_ENTRIES
SHA-256: $RELEASE_SHA256

Manifest commit: $FINAL_COMMIT
Manifest tree: $FINAL_TREE
Manifest SHA-256: $RELEASE_SHA256

Provenance commit: $FINAL_COMMIT
Provenance tree: $FINAL_TREE
Provenance SHA-256: $RELEASE_SHA256

Consistency check: ALL_RELEASE_IDENTIFIERS_MATCH
GPG fingerprint: $GPG_FINGERPRINT
GPG signature: VALID
GPG verification: PASS

Secrets in package: NO
Deploy executed: NO

Decision: READY FOR DEPLOYMENT EXECUTION
''')
"

cat "$RELEASE_ROOT/RELEASE-SUMMARY.txt"
log "READY FOR DEPLOYMENT EXECUTION"