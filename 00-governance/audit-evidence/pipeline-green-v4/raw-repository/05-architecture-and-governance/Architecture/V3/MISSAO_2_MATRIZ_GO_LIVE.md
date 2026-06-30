# MISSÃO REGEBANK — AUDITORIA TOTAL, TRIAGEM GO-LIVE E BÍBLIA ARQUITETURAL

> Parte 1 é régua homologada.  
> Parte 2 funciona no Vercel e pipeline verde no GitHub.  
> O problema não é vitrine.  
> O problema é o interior ainda não carregar o mesmo metal.

Este pacote não tenta provar que a Parte 2 liga.  
Ela já liga.

Este pacote mostra o que precisa mudar para a Parte 2 virar sistema nosso: teste, tom, autoria, segurança, contrato e prova.

## MISSÃO 2 — MATRIZ DE TRIAGEM GO-LIVE

### Quadrantes

| Quadrante | Significado | Regra seca |
|---|---|---|
| PERFEITO | sólido, isolado, preservável | não mexe por vaidade |
| A SER REFEITO | mock, segredo, lixo, simulação, legado perigoso | mata ou reescreve |
| A SER REALOCADO | código bom no lugar errado, responsabilidade misturada | tira da sala errada |
| A SER CONECTADO | tela/serviço/endpoints sem contrato final | conecta com backend, Prometeo e teste |

### Contagem de artefatos por quadrante

| Quadrante | Total |
|---|---:|
| A SER REFEITO | 253050 |
| PERFEITO | 129 |
| A SER CONECTADO | 146 |
| A SER REALOCADO | 647 |

## Leitura por pacote

| Pacote | Estado | Veredito |
|---|---|---|
| Parte 1 homologada | base aprovada | PERFEITO. Não vira refém da Parte 2. |
| Backend Parte 2 | funciona, mas carrega node_modules, .env, mocks e pontos de SAST | A SER REFEITO / REALOCADO / CONECTADO. Core precisa herdar régua da Parte 1. |
| Mobile Parte 2 | app real, Expo, telas e API, mas com pouca prova e vendor empacotado | A SER REALOCADO. Mobile é rua. Rua não decide dinheiro. |
| Frontend Parte 2 | Vercel funciona, UX bonita, contrato parcialmente presente | A SER CONECTADO. Vitrine aprovada precisa contrato vivo. |
| Infra Parte 2 | Kubernetes/Cloud Build/Argo presentes | PERFEITO parcial. Precisa virar esteira única com evidência. |
| Docs Parte 2 | documentação útil, mas dispersa | A SER REALOCADO. Documento morto vira poeira. |
| Arquivos soltos | deploy manual, packages, ignores | A SER REFEITO. Solto é risco. |
| Arquivo 5 | cobertura/evidência | PERFEITO parcial. Evidência precisa morar em relatório versionado certo. |
| GitHub pipeline verde | recibo de funcionamento | PERFEITO como base. Ainda precisa tom, testes e autoria interna. |

## Itens PERFEITOS que não devem ser demolidos

- Pipeline GitHub aprovado como esteira base.
- Vercel funcionando como vitrine real.
- Parte 1 homologada como padrão de tom, teste, gate, operação e documentação.
- Frontend com estrutura de Vite/React e testes existentes.
- Backend com NestJS, TypeORM, módulos bancários e pipeline DevSecOps.
- Infra com Cloud Run/GKE/Argo/Cloud Armor como direção correta.

## Itens A SER REFEITO

- `node_modules` dentro dos pacotes. Dependência versionada é aterro sanitário.
- `__MACOSX` e `.DS_Store`. Lixo de ZIP não entra em banco.
- `.env` e valores sensíveis em pacote. Segredo fora do Secret Manager é vazamento esperando commit.
- deploy manual solto. Pipeline é a única via.
- mock/fake/demo fora de teste. Simulação em produção é mentira com UI bonita.
- auth retornando token fixo/mock em caminho de runtime. Token que nasce falso mata o contrato.

## Itens A SER REALOCADO

- `tmp_backend` dentro do frontend. Backend não mora na vitrine.
- Código mobile duplicado dentro do frontend. Mobile é borda própria.
- Lógica de negócio dentro de página/componente. Tela mostra. Backend decide.
- Documentos de compliance misturados com evidência bruta sem índice. Auditoria precisa achar a prova depois.

## Itens A SER CONECTADO

- Frontend -> NestJS para Pix, Open Finance, auth e dashboard.
- Frontend -> Prometeo apenas via backend proxy. Prometeo não vai para bundle.
- Mobile -> backend com contrato de sessão, idempotência e step-up.
- Docs -> OpenAPI/Orval real, com geração controlada.
- Observabilidade -> trace id do frontend chegando no backend e aparecendo no log.

## Frase da triagem

Funcionar já funciona.  
Agora precisa pertencer.

Vitrine aprovada não fecha banco.  
Pipeline verde não prova arquitetura.  
Parte 2 só vira nossa quando teste, tom e fronteira entrarem no osso.
