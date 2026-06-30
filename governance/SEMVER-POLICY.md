# Semver Policy — Regenera Bank

> Versioning follows [Semantic Versioning 2.0.0](https://semver.org/).
> Format: `MAJOR.MINOR.PATCH` (e.g. `1.4.2`).

## Version surfaces

| Surface | Location | Independent versioning |
|---------|----------|------------------------|
| Monorepo root | `package.json` (`private`) | Coordination only |
| Deployable services | `apps/*`, `bff/*`, `workers/*`, `domains/*` | Yes |
| API contracts | `contracts/openapi/*.yaml` | Yes (`info.version`) |
| Event contracts | `contracts/asyncapi/*.yaml`, `contracts/events/*.json` | Yes (`eventVersion` + doc version) |
| Error catalog | `governance/error-catalog/CORE-ERRORS.json` | Catalog `version` field |
| Feature flags | `governance/feature-flags/FEATURE-FLAGS.json` | Catalog `version` field |

## MAJOR (breaking)

Increment when any of the following occur:

- Removed or renamed public API path, field, or header.
- Changed monetary field semantics (e.g. cents vs decimal string).
- Tightened validation that rejects previously accepted payloads.
- Removed or renamed event type; changed envelope required fields.
- Retired error code still referenced by consumers.
- Default change of a feature flag from `false` → `true` for regulated flows.

Requires: migration guide, ADR, coordinated multi-package release.

## MINOR (backward compatible)

Increment when:

- New optional API fields or endpoints added.
- New event types or optional envelope fields added.
- New error codes added without changing existing codes.
- New feature flags added (default `false` unless documented exception).

## PATCH (backward compatible fixes)

Increment when:

- Documentation-only contract clarifications.
- Bug fixes restoring documented behavior.
- Internal implementation changes with no contract diff.
- Feature flag description or metadata updates without behavior change.

## Pre-release tags

| Tag | Use |
|-----|-----|
| `-alpha.N` | Internal integration; contracts may break |
| `-beta.N` | Partner/staging; contract freeze except fixes |
| `-rc.N` | Release candidate; identical to intended GA contract |

## Event versioning

- `eventVersion` in `contracts/events/event-envelope.schema.json` is an integer per `eventType`.
- Same `eventType` + higher `eventVersion` must remain consumable by N-1 readers for one minor cycle.
- Breaking event payload changes → new `eventType` or MAJOR catalog bump.

## API versioning

- URL prefix: `/v{major}` (e.g. `/v1/accounts`).
- OpenAPI `info.version` tracks package release; path major tracks compatibility.
- Deprecation: `Sunset` header + 6-month notice in changelog before removal.

## Release process

1. Bump affected package `version` fields.
2. Update `CHANGELOG.md` in each changed deployable unit.
3. Update contract `info.version` / catalog `version` when schemas change.
4. Tag repository: `v{service}-{version}` for services; `contracts-v{version}` for contract-only releases.

## Prohibited

- Resetting versions backward on any published artifact.
- Publishing breaking changes under PATCH.
- Silent default flip of regulated feature flags (crypto, PIX live, persistence mode).