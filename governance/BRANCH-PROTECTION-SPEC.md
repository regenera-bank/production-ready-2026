# Branch Protection Specification — Regenera Bank

> Status: **FOUNDATION** — applies to `main` and release branches.
> Enforcement is configured in the Git host; this document is the source of truth.

## Protected branches

| Branch pattern | Purpose |
|----------------|---------|
| `main` | Integration trunk; always deployable artifact |
| `release/*` | Semver release lines (`release/1.2.x`) |
| `hotfix/*` | Emergency production fixes from a release line |

## Required checks (must pass before merge)

| Check | Scope | Blocking |
|-------|-------|----------|
| `ci / lint` | All changed packages | Yes |
| `ci / test` | All changed packages | Yes |
| `ci / build` | All changed packages | Yes |
| `validate:contracts` | Contract/schema changes | Yes |
| `security / sbom` | Dependency changes | Yes |
| `security / secret-scan` | All PRs | Yes |

## Pull request rules

- **Required reviewers:** minimum 2; at least 1 from `CODEOWNERS` for touched paths.
- **CODEOWNERS approval:** required when files under owned paths change.
- **Dismiss stale reviews:** enabled.
- **Require conversation resolution:** enabled.
- **Require linear history:** squash or rebase merge only; no merge commits on `main`.
- **Require signed commits:** GPG or SSH commit signing per org policy.
- **Require branches up to date:** enabled before merge.

## Restrictions

- **Force push:** disabled on protected branches.
- **Branch deletion:** disabled on `main` and active `release/*`.
- **Bypass list:** empty by default; emergency bypass requires incident ticket + post-merge review within 24h.

## Contract and governance gates

Changes under `contracts/`, `governance/error-catalog/`, or `governance/feature-flags/` require:

1. `pnpm validate:contracts` green in CI.
2. Explicit mention in PR description of consumer impact (BFF, core-bank, workers).
3. Semver impact noted per `governance/SEMVER-POLICY.md`.

## Release branch rules

- Created from `main` at release cut; only bugfixes and changelog entries allowed.
- Cherry-picks from `main` require identical commit hash or documented divergence ADR.
- Tag `vMAJOR.MINOR.PATCH` only from `release/*` or `hotfix/*` after full gate suite.

## Audit evidence

Every merge to `main` must retain:

- CI run URL
- PR approval record
- SBOM artifact reference
- Contract validation log when applicable

Retention: 7 years (regulatory baseline).