# 10 — CI Pipeline Evidence

**HEAD:** `FINAL_COMMIT_PENDING`
**Script:** `scripts/run-pre-deploy-gates.sh` (implícito pelo layout `full-ci/run1`)
**Resultado global:** **FAIL**

---

## Run metadata

```json
{
  "run_id": 1,
  "result": "FAIL",
  "started_at": "2026-06-30T21:22:51Z",
  "finished_at": "2026-06-30T21:24:24Z",
  "gates_executed": 48,
  "postgres_available": 1,
  "redis_available": 1,
  "artifact_dir": "artifacts/verification/full-ci/run1"
}
```

**Path:** `artifacts/verification/full-ci/run1/run-metadata.json`

---

## Code hash (reprodutibilidade)

```
git_head: FINAL_COMMIT_PENDING
git_tree: a9e3a8b8bb2b8e40d23c9947331fd0c47f171919
implantable_manifest_sha256: 4e4c3b07acd872c727564f9af6b6f8914e2ae82a307dff3c55901d73ae7fe496
line_count: 221
```

**Path:** `artifacts/verification/full-ci/run1/hash/code-tested.log`

---

## Gate manifest (primeiros 10)

| seq | gate | exit |
|-----|------|------|
| 1 | runtime-versions | 0 |
| 2 | code-hash | 0 |
| 3 | infra-postgres-check | 0 |
| 4 | infra-redis-check | 0 |
| 5 | infra-postgres-db-prep | 0 |
| 6 | install-core-bank | 0 |
| 7 | install-web-bff | 0 |
| 8 | install-outbox-relay | 0 |
| 9 | install-web-banking | 0 |
| 10 | migrations | 0 |

**Path completo:** `artifacts/verification/full-ci/run1/gate-manifest.jsonl` (48 entradas)

---

## Falhas que causam FAIL global

| Gate | Exit | Ação |
|------|------|------|
| audit-npm-core-bank | 1 | Atualizar deps ou ADR de aceite |
| audit-npm-web-bff | 1 | Atualizar multer/nest transitive |

---

## Artefatos paralelos

| Run | Path | Nota |
|-----|------|------|
| ci/run1 | `artifacts/verification/ci/run1/` | subset gates |
| unit isolado | `artifacts/verification/unit/` | logs históricos audit doc 05 |

---

## Próximo gate verde

1. Resolver npm audit em core-bank e web-bff
2. Reexecutar `full-ci/run2` com exit 0 em security
3. Registrar novo HEAD em `hash/code-tested.log`
