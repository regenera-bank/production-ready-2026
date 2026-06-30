# ARCHITECTURE_BIBLE.md — REGENERA BANK

> Documento de referência institucional.  
> Parte 1 está homologada.  
> Parte 2 funciona no Vercel e pipeline verde no GitHub.  
> Esta Bíblia existe para elevar a Parte 2 ao mesmo nível da Parte 1.

Não é documento de venda.
Não é pitch.
Não é enfeite para investidor.

É mapa de cofre.

## 0. Verdade operacional atual

| Bloco | Estado | Decisão |
|---|---|---|
| Parte 1 | homologada e validada | régua de qualidade |
| Parte 2 Backend | funcional, NestJS, Cloud Run, Postgres, Open Finance | refatorar com testes, tom e fronteiras |
| Parte 2 Mobile | funcional, Expo/React Native | endurecer borda, testes e cofre local |
| Parte 2 Frontend | Vercel funcionando | preservar vitrine, refazer interior |
| Parte 2 Infra | manifests e GCP presentes | conectar ao pipeline e evidência |
| Parte 2 Docs | úteis mas dispersos | centralizar e reescrever no tom |
| GitHub Pipeline | verde aprovado | base oficial de entrega |

## 1. Princípios de arquitetura

### 1.1 Dinheiro

Dinheiro não é `number`.
Dinheiro não é estado de tela.
Dinheiro não é cache.

Dinheiro nasce no ledger.
Ledger prova.
Banco trava.
Auditoria reconstrói.

### 1.2 Frontend

Frontend mostra.
Frontend coleta.
Frontend não decide dinheiro.
Frontend não guarda segredo.

Vitrine bonita não fecha banco.

### 1.3 Mobile

Mobile é rua.
Rua tem root, print, malware, rede ruim e sessão velha.

Mobile faz step-up.
Backend decide.
Ledger prova.

### 1.4 Backend

Backend é juiz.
Mas juiz sem ledger vira opinião.

Controller recebe.
Service decide.
Banco garante.
Outbox comunica.
Log prova.

### 1.5 Infra

Pipeline é porteiro.
Secret Manager é cofre.
Vercel é vitrine.
Cloud Run é motor.
Postgres é memória.
Redis é trava curta.

## 2. Visão geral da stack

| Camada | Tecnologia observada | Função | Risco se mal usada |
|---|---|---|---|
| Web | React, Vite, Vercel, Firebase | vitrine empresarial | segredo no bundle, re-render, API solta |
| Mobile | Expo, React Native, Firebase | borda do cliente | token local, promessa sem backend |
| Backend | NestJS, TypeORM, Cloud Run | decisão e orquestração | controller gordo, rota sem guard, mock vivo |
| Banco | Postgres/Neon | ledger, consent, auth, Pix | migration fraca, N+1, rollback quebrado |
| Cache/lock | Redis | idempotência/rate limit | lock falso, corrida duplicando dinheiro |
| Open Banking | Prometeo via backend | conexão bancária externa | chave no frontend, endpoint sem contrato |
| Observabilidade | Prometheus/Sentry/OpenTelemetry sugeridos | ver o sistema sangrar | painel mentindo, label com dado sensível |
| Infra | GCP, Cloud Run, GKE, Cloud Armor, Argo | operação e segurança | deploy manual, segredo em script |

## 3. Diagrama C4 — Contexto

```mermaid
C4Context
    title Regenera Bank — Contexto
    Person(cliente, "Cliente", "Usa Web/Mobile")
    Person(operador, "Operação/Compliance", "Audita, congela, responde incidente")
    System(web, "Frontend Vercel", "React/Vite. Vitrine. Não decide dinheiro.")
    System(mobile, "Mobile Expo", "Borda hostil. Cofre local. Step-up.")
    System(core, "Core Banking NestJS", "Decide, valida, orquestra.")
    SystemDb(db, "Postgres/Neon", "Ledger, Pix, Auth, Compliance.")
    System(redis, "Redis", "Idempotência, rate limit, lock curto.")
    System_Ext(firebase, "Firebase", "Identidade e token.")
    System_Ext(prometeo, "Prometeo OpenBanking", "Dados bancários via backend.")
    System_Ext(bacen, "BACEN / SPI / Pix", "Liquidação e homologação Pix.")

    Rel(cliente, web, "Acessa")
    Rel(cliente, mobile, "Acessa")
    Rel(web, firebase, "Obtém IdToken")
    Rel(mobile, firebase, "Obtém IdToken / biometria local")
    Rel(web, core, "API com Bearer + Idempotency-Key")
    Rel(mobile, core, "API com sessão + step-up")
    Rel(core, db, "Transação ACID / ledger")
    Rel(core, redis, "Lock/idempotência/rate limit")
    Rel(core, prometeo, "Proxy seguro")
    Rel(core, bacen, "Pix/SPI via integração homologada")
    Rel(operador, core, "Backoffice/Compliance")
```

## 4. Fluxo de dados Pix

```mermaid
flowchart TD
    A[Cliente na Web/Mobile] --> B[Frontend gera Idempotency-Key]
    B --> C[Firebase IdToken]
    C --> D[Backend NestJS /pix]
    D --> E{Guards: JWT, sessão, conta, limite, step-up}
    E -- falha --> Z[Erro com code estável]
    E -- ok --> F[Redis/Postgres lock de idempotência]
    F --> G[Transação Postgres]
    G --> H[Ledger debit/credit]
    H --> I[Outbox PixRequested]
    I --> J[Commit]
    J --> K[Worker envia provedor/SPI]
    K --> L[Webhook raw body]
    L --> M[Validação assinatura/replay]
    M --> N[Atualiza Pix SETTLED/FAILED/REVERSED]
    N --> O[Reconciliação diária]
```

## 5. Sequência de autenticação biométrica

```mermaid
sequenceDiagram
    participant U as Cliente
    participant M as Mobile
    participant SS as SecureStore
    participant FB as Firebase
    participant API as Backend NestJS
    participant DB as Postgres

    U->>M: abre app
    M->>SS: lê device secret
    SS-->>M: segredo local se existir
    M->>M: biometria local / step-up
    M->>FB: obtém IdToken
    FB-->>M: IdToken
    M->>API: request com Bearer + device proof
    API->>API: valida token, sessão, device, escopo
    API->>DB: registra auth_event append-only
    DB-->>API: trilha gravada
    API-->>M: autorização limitada
```

Biometria não autoriza dinheiro sozinha.
Biometria destrava intenção.
Backend decide.
Ledger prova.

## 6. Matriz de risco

| Risco | Probabilidade | Impacto | Estado atual | Ação |
|---|---:|---:|---|---|
| Segredo em pacote `.env`/script | Alta | Crítico | detectado em Parte 2/GitHub | remover, rotacionar, Secret Manager |
| Prometeo/API key no frontend | Média | Crítico | frontend tem blindagem/deprecated | bloquear import, teste SAST |
| Pix duplicado por corrida | Média | Crítico | testes existem na Parte 1 | levar para Parte 2 real |
| Ledger sem constraint no banco | Baixa/Média | Crítico | Parte 1 forte | replicar no core aprovado |
| Rota Nest sem guard | Média | Alto | detectado por heurística | marcar pública ou proteger |
| React re-render/fetch loop | Média | Médio | detectado por useEffect | revisar dependências/cache |
| Listener/timer sem cleanup | Média | Médio | detectado | cleanup obrigatório |
| Node_modules versionado | Alta | Médio | detectado em Parte 2 | remover do repo/ZIP |
| Docs dispersos | Alta | Médio | detectado | centralizar em `5. Docs` |
| Deploy manual | Média | Alto | detectado | pipeline único |

## 7. Plano de ação para deploy real

### Fase 0 — preservar o que funciona

- Congelar ZIP GitHub pipeline verde como baseline.
- Exportar envs de Vercel e Cloud Run, sem revelar segredo.
- Rodar smoke test no login Vercel.
- Abrir branch `refactor/parte2-nivel-parte1`.

### Fase 1 — limpar sem quebrar

- Remover `node_modules`, `__MACOSX`, `.DS_Store`.
- Remover `.env` de pacotes.
- Remover deploy manual solto.
- Manter Vercel e pipeline intactos.

### Fase 2 — conectar contrato

- Gerar OpenAPI do NestJS.
- Gerar client com Orval no frontend.
- Mapear endpoints usados pelo frontend.
- Matar endpoint fantasma.
- Garantir Prometeo só via backend.

### Fase 3 — colocar teste onde hoje tem confiança

- Testes de API client.
- Testes de Pix UI com idempotency key estável.
- Testes de auth com Firebase mockado controlado.
- Testes de backend por rota protegida.
- Teste SAST bloqueando segredo.

### Fase 4 — aplicar tom e autoria

- Comentário só explica risco.
- Documento só fica se tiver prova.
- README para de vender e passa a orientar operação.
- Erro vira code estável.
- Vitrine para de prometer o que backend não prova.

### Fase 5 — produção assistida

- Shadow mode.
- Piloto com limite baixo.
- Observabilidade ligada.
- Reconciliação diária.
- Runbook testado.

## 8. Aderência BACEN / PCI-DSS

Este documento não substitui jurídico, compliance nem homologação formal.
Ele organiza controles técnicos para suportar essa conversa.

### Controles mínimos

| Controle | Prova técnica esperada |
|---|---|
| Imutabilidade financeira | trigger/constraint + teste |
| Reconciliação Pix | job diário + relatório |
| Idempotência | chave + lock + replay testado |
| Auditoria | log append-only + correlation id |
| Segredo | Secret Manager/KMS + rotação |
| Dados sensíveis | criptografia/hash/retenção |
| PCI | escopo reduzido, tokenização, segregação |
| LGPD | consentimento, direito do titular, evidência |

## 9. Regra de autoria

Parte 2 não precisa ficar mais bonita.
Precisa ficar mais nossa.

Nosso tom não é decoração.
É método.

Risco.
Consequência.
Prova.
Limite.

Sem isso, o sistema pode até funcionar.
Mas ainda não assina o próprio nome.
