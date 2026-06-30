# Migração de segredos — Vercel

O pacote original continha `.env` e uma cópia em `credentials/received/.env.original`.

Esses arquivos foram removidos do artefato revisado. Valores previamente distribuídos devem ser rotacionados no provedor correspondente.

## Destino correto

- variáveis públicas do Vite: Vercel Environment Variables com prefixo `VITE_`, apenas quando forem realmente públicas;
- segredos de IA, banco, JWT e Firebase Admin: backend Cloud Run/Secret Manager;
- nunca expor `GEMINI_API_KEY` no bundle do navegador.

O vínculo `.vercel/project.json` foi preservado porque contém identidade de projeto, não credencial de autenticação.
