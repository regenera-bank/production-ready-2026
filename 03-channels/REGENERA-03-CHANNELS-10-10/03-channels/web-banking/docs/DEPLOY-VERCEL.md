# Deploy Vercel — passo a passo

## 1. Pré-requisitos

- Node 22.18.x;
- npm 10.x;
- acesso ao time Vercel `team_U5NsbZESUUfJboZ7kh37rfKp`;
- acesso ao projeto `11-0-regenera-corporate-we-bank-we-future-2026-06-23-e89fb`.

## 2. Segredos

O arquivo `.env` recebido contém `GEMINI_API_KEY`. A chave foi preservada porque você pediu o mesmo material, mas o arquivo não deve ser commitado.

Para registrar no Vercel:

```bash
npx vercel@latest login
npx vercel@latest link --yes
npx vercel@latest env add GEMINI_API_KEY production
npx vercel@latest env add GEMINI_API_KEY preview
```

A aplicação web é estática. Não renomeie segredo de servidor para prefixo `VITE_`; isso o exporia no bundle do navegador.

Variáveis públicas esperadas pela fonte:

```text
VITE_API_URL=https://regenera-core-api-520859662036.southamerica-east1.run.app/v1
VITE_PIX_WS_URL=https://regenera-core-api-520859662036.southamerica-east1.run.app
VITE_WS_URL=https://regenera-core-api-520859662036.southamerica-east1.run.app
```

## 3. Build local

```bash
npm ci
npm run build
```

O `vercel.json` executa `npm run build`, publica `dist` e aplica headers de segurança e rewrites para o backend.

## 4. Preview

```bash
npx vercel@latest deploy
npx vercel@latest logs --level error
```

Valide login, rotas SPA, chamadas `/api`, cache, CSP/headers, mobile viewport e acessibilidade.

## 5. Produção

```bash
npx vercel@latest deploy --prod
```

O projeto recebido está vinculado a `11-0-regenera-corporate-we-bank-we-future-2026-06-23-e89fb`. Confirme domínio, aliases e ambiente antes de promover.

## 6. Rollback

Promova novamente o deployment estável anterior pelo dashboard/CLI. Backend e web têm rollback independente; não acople os dois por pressa.

## Links oficiais

- Deploy por CLI: https://vercel.com/docs/cli/deploy
- Fluxo completo por CLI: https://vercel.com/docs/projects/deploy-from-cli
- Configuração do projeto: https://vercel.com/docs/project-configuration
