# 11 — Secrets Rotation Plan

Classificação: `ROTATION_REQUIRED_BEFORE_DEPLOY` (rotação efetiva na fase de deploy).

| Secret | Local anterior | Ação |
|--------|----------------|------|
| PROMETEO_API_KEY | quarentena | Secret Manager + rotate |
| JWT_SESSION_SECRET | quarentena | rotate + invalidate sessions |
| GEMINI_API_KEY | quarentena | rotate |
| FIREBASE_* | quarentena | rotate + rebuild web sem bake |
| DATABASE_URL password | quarentena | RDS creds novas |

Nunca imprimir valores. Ver `docs/audit/14-SECURITY-AND-SECRETS-AUDIT.md`.
