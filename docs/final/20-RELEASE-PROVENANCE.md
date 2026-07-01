# 20 — Release Provenance

Commit final: `FINAL_COMMIT_PENDING`
Tree hash: `FINAL_TREE_PENDING`
SHA-256 pacote: `FINAL_PACKAGE_PENDING`

## Cadeia

```
git commit (FINAL_COMMIT_PENDING)
  → CI Run 1 exit 0 (mesmo commit/tree)
  → CI Run 2 exit 0 (mesmo commit/tree)
  → git archive → ZIP
  → SHA-256 → manifest.json → provenance.json (SLSA v1)
  → GPG detach-sign SHA-256
```

Artefatos externos: `$HOME/Desktop/REGENERA-FINAL-RELEASE/`

Proibido reutilizar evidência de commits anteriores (`FINAL_COMMIT_PENDING`, `FINAL_COMMIT_PENDING`, `FINAL_COMMIT_PENDING`, `FINAL_COMMIT_PENDING`).
