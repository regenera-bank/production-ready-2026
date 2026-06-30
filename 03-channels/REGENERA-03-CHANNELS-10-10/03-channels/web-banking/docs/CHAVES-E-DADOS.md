# Chaves e dados — Vercel

| item | estado | ação |
|---|---|---|
| `.vercel/project.json` | presente | mantém vínculo com o projeto recebido |
| `GEMINI_API_KEY` | presente no `.env` privado | mover para Environment Variables e excluir da cópia de trabalho |
| `VITE_API_URL` | não recebida como segredo | configurar como variável pública |
| token Vercel de CI | ausente | criar somente para pipeline não interativa |
| domínio customizado/DNS | não materializado no ZIP | conferir no dashboard Vercel e provedor DNS |

O `.env` não é contrato público. O valor não aparece nesta documentação.
