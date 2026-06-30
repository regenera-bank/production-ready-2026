# DADOS DO ARQUIVO — Vercel

## Identidade

- pacote: `3.Regenera-Vercel-Production`
- data de consolidação: 2026-06-24
- origem funcional: `regenera-corebank-production-20-melhorias`
- finalidade: build e deploy do customer web no projeto Vercel existente
- documentação de deploy: `docs/DEPLOY-VERCEL.md`

## Regra de uso

Este ZIP é um pacote privado de release. Fonte, configuração, credencial e artefato recebido estão separados por diretório. Nada deve ser movido para um repositório público por conveniência.

## Credenciais e chaves

- vínculo Vercel: **presente** em `.vercel/project.json`;
- project ID: `prj_3HTIYKOfm8NkEFMkoDmcpNrz7EVJ`;
- org/team ID: `team_U5NsbZESUUfJboZ7kh37rfKp`;
- project name: `11-0-regenera-corporate-we-bank-we-future-2026-06-23-e89fb`;
- variáveis recebidas: `GEMINI_API_KEY`;
- valores secretos: preservados no `.env`, não reproduzidos na documentação;
- regra: o `.env` entra neste ZIP privado, mas não entra no GitHub.

## Diretórios

- `source/`: código-fonte canônico da plataforma;
- `credentials/`: material recebido que precisa de cofre e controle de acesso;
- `artifacts/`: binários ou referências recebidas;
- `docs/`: implantação, identidade, segurança e operação;
- `scripts/`: verificações locais que não imprimem segredos;
- `CHECKSUMS.sha256`: integridade de cada arquivo do pacote.

## Critério de produção

Arquivo presente não significa homologação concluída. Publicação só ocorre depois de identidade, assinatura, ambiente, observabilidade, política de privacidade, testes e rollback estarem validados no console da plataforma.
