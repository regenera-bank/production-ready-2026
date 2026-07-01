# 14 — Package Reproducibility

Commit final: `FINAL_COMMIT_PENDING`
Tree hash: `FINAL_TREE_PENDING`
Data UTC: FINAL_PACKAGE_PENDING

## Método autoritativo

O pacote de release é gerado exclusivamente por `git archive` no commit congelado — nunca por `zip` do diretório de trabalho.

## Validações

| Gate | Evidência | Status |
|------|-----------|--------|
| ZIP integrity | `unzip -t` | PASS |
| Extraído vs commit | `diff -qr` worktree vs extract | PASS |
| Arquivos proibidos | `.git`, `node_modules`, `.env`, `._*` | 0 hits |
| Gitleaks no pacote | `gitleaks detect --no-git` | PASS |
| SHA-256 | `.zip.sha256` | FINAL_PACKAGE_PENDING |

## Coerência

ZIP, manifest, provenance e documentação apontam para o mesmo `FINAL_COMMIT_PENDING` / `FINAL_TREE_PENDING`.
