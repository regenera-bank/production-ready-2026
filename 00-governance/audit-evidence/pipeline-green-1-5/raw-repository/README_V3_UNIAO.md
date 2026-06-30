# REGENERA BANK — VERSÃO 3: UNIÃO SEM PERFUME

Parte 1 é régua homologada.
Parte 2 liga no Vercel.
Pipeline GitHub está verde.

Isso não basta.

A versão 3 existe para unir tudo sem matar o que já funciona.

## O corte

- vitrine fica
- pipeline fica
- deploy fica
- interior genérico morre
- mock em runtime morre
- segredo em arquivo morre
- regra financeira em tela morre
- backend volta a ser juiz
- ledger volta a ser memória
- docs viram contrato

## Regra

Não quebra o que está vivo.
Mas não deixa vivo o que mente.

## Pacotes da cirurgia

| ZIP | Função |
|---|---|
| `RegeneraBank_V3_00_master_uniao_sem_perfume.zip` | pacote completo sanitizado e organizado |
| `RegeneraBank_V3_01_backend_core.zip` | backend, contratos, testes e cirurgia de segurança |
| `RegeneraBank_V3_02_frontend_vercel.zip` | frontend Vercel, autoria, API client, risco de UI |
| `RegeneraBank_V3_03_mobile_borda.zip` | mobile, SecureStore, biometria, borda hostil |
| `RegeneraBank_V3_04_infra_pipeline.zip` | GitHub, Vercel, GCP, secrets, deploy |
| `RegeneraBank_V3_05_docs_biblia.zip` | Bíblia, missões, matriz, plano de reforma |
| `RegeneraBank_V3_06_evidence_sast.zip` | inventário, triagem, SAST redigido |

## Segredos

Segredo colado em chat não entra em repositório.
Mesmo sandbox vira incidente de higiene.

Rotaciona.
Move para Secret Manager.
No GitHub, só referência.
No Vercel, só env pública quando for `VITE_*`.

Frontend não guarda segredo.
Mobile não guarda segredo.
Backend recebe segredo por cofre.

Segredo fora do backend é vazamento esperando commit.
