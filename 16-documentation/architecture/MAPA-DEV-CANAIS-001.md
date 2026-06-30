# Regenera Bank — Mapa Mestre de Desenvolvimento dos Canais

**Documento:** MAPA-DEV-CANAIS-001  
**Status:** Baseline para execução  
**Escopo:** Web, Android, iOS, Windows Operations e APIs de Parceiros  
**Objetivo:** Converter o protótipo HTML do Regenera Bank em canais bancários reais, conectados a uma plataforma financeira auditável, segura e operável em produção.

---

## 1. Princípio central

O HTML atual é uma referência de produto, navegação, identidade visual e intenção funcional. Ele não deve ser convertido diretamente em um aplicativo bancário por meio de WebView ou encapsulamento simples.

A transformação correta é:

```text
Protótipo HTML
    ↓
Catálogo funcional e mapa de jornadas
    ↓
Design System multiplataforma
    ↓
Contratos de API e modelos de domínio
    ↓
BFFs por canal
    ↓
Core Banking, ledger e serviços de produto
    ↓
Canais Web, Android, iOS, Windows Operations e APIs Parceiros
    ↓
Segurança, observabilidade, homologação e operação 24×7
```

Nenhum canal movimenta dinheiro diretamente. Os canais criam intenções autenticadas; os serviços de domínio validam; o ledger registra; os adaptadores externos liquidam; a conciliação confirma.

---

## 2. Resultado esperado

Ao final do programa, a organização deverá possuir:

- Web Banking de produção;
- aplicativo Android nativo;
- aplicativo iOS nativo;
- plataforma Windows Operations para backoffice;
- portal e gateway de APIs para parceiros;
- Design System compartilhado e versionado;
- contratos OpenAPI, AsyncAPI e eventos;
- identidade, autenticação e confiança de dispositivo;
- Core Banking e ledger auditável;
- integrações com Pix, cartões e demais redes;
- observabilidade, segurança e operação 24×7;
- pipelines assinados e segregados;
- ambientes de desenvolvimento, homologação, produção e disaster recovery;
- evidências técnicas para auditoria e homologação.

---

## 3. Diagnóstico do protótipo atual

O arquivo apresenta 23 módulos visuais:

1. Home
2. Transações
3. Pix
4. Transferências
5. Cartões
6. Investimentos
7. Cripto
8. Crédito
9. Proteção
10. Cloud
11. Kids
12. Senior
13. Pets
14. Dreams
15. Marketplace
16. Rewards
17. Discounts
18. Events
19. Travel
20. Sustainability
21. Academy
22. Analytics
23. Profile

A lógica atual é local e demonstrativa. Funções como autenticação, Pix, transferência, crédito, seguros, cloud e assistente alteram apenas o estado visual, arrays em memória ou notificações do navegador.

### Decisão arquitetural

O protótipo será usado como:

- referência visual;
- inventário inicial de módulos;
- mapa de navegação;
- catálogo de intenções do usuário;
- base para design tokens;
- referência de microinterações;
- fonte para critérios de aceitação visual.

Não será usado como:

- backend;
- ledger;
- mecanismo de autenticação;
- motor de pagamentos;
- processador de cartões;
- banco de dados;
- aplicativo nativo encapsulado;
- backoffice de produção.

---

## 4. Arquitetura-alvo dos canais

```text
┌────────────────────────────────────────────────────────────────────┐
│                              CANAIS                                │
│ Web Banking │ Android │ iOS │ Windows Operations │ Partner Portal │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                     EDGE E CONTROLE DE ACESSO                      │
│ CDN │ Anti-DDoS │ WAF │ Bot Protection │ API Gateway │ Rate Limit │
│ OAuth/OIDC │ mTLS │ Device Attestation │ Certificate Management   │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                             BFFs                                   │
│ Web BFF │ Mobile BFF │ Operations BFF │ Partner API Facade         │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                       SERVIÇOS DE DOMÍNIO                          │
│ Identity │ Customer │ Account │ Ledger │ Payments │ Pix │ Cards    │
│ Credit │ Investments │ Limits │ Fees │ Statements │ Notifications │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                    CONTROLE E CONFIABILIDADE                       │
│ Fraud │ AML │ KYC │ Sanctions │ Audit │ Reconciliation │ Accounting│
│ Regulatory Reporting │ Case Management │ Consent                   │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                         MUNDO EXTERNO                              │
│ SPI │ DICT │ Open Finance │ Bandeiras │ Processadores │ Bureaus   │
│ KYC │ Custódia │ Corretoras │ Notificações │ Parceiros             │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. Fronteiras por canal

### 5.1 Web Banking

**Público:** clientes PF/PJ e usuários autorizados.

**Responsabilidades:**

- onboarding web;
- autenticação e recuperação;
- dashboard;
- contas e saldos;
- extrato e comprovantes;
- Pix e transferências;
- cartões;
- crédito;
- investimentos;
- segurança e dispositivos;
- consentimentos;
- atendimento;
- acessibilidade;
- responsividade.

**Arquitetura recomendada:**

- TypeScript;
- framework React com renderização híbrida;
- BFF exclusivo;
- rotas protegidas;
- cookies seguros;
- CSP restritiva;
- componentes server/client separados;
- telemetria e feature flags;
- testes unitários, integração, acessibilidade e E2E.

**Não permitido:**

- chaves privadas no frontend;
- acesso direto ao banco de dados;
- cálculo final de saldo no navegador;
- decisão de fraude no cliente;
- credenciais privilegiadas;
- chamadas diretas do navegador às redes financeiras.

---

### 5.2 Android

**Público:** clientes PF/PJ.

**Responsabilidades específicas:**

- onboarding por câmera;
- biometria;
- prova de vida;
- vínculo de dispositivo;
- leitura de QR Code;
- push;
- proteção contra sobreposição;
- armazenamento seguro;
- integridade do aplicativo;
- recuperação segura;
- assinatura/confirmação de transações.

**Arquitetura recomendada:**

- Kotlin;
- Jetpack Compose;
- arquitetura modular;
- Android Keystore;
- BiometricPrompt;
- Play Integrity;
- networking com políticas de timeout e retry controlado;
- banco local apenas para cache não autoritativo;
- R8/obfuscation;
- telemetria sem dados financeiros sensíveis.

**Módulos sugeridos:**

```text
app
core-design
core-network
core-security
core-observability
core-storage
feature-auth
feature-onboarding
feature-home
feature-accounts
feature-transactions
feature-pix
feature-transfers
feature-cards
feature-credit
feature-investments
feature-profile
feature-support
```

---

### 5.3 iOS

**Público:** clientes PF/PJ.

**Responsabilidades específicas:**

- Face ID/Touch ID;
- Keychain;
- Secure Enclave quando aplicável;
- App Attest/DeviceCheck;
- captura documental;
- QR Code;
- push;
- universal links;
- proteção de snapshots;
- armazenamento e sessão seguros;
- recuperação segura;
- confirmação de operações críticas.

**Arquitetura recomendada:**

- Swift;
- SwiftUI;
- módulos por feature;
- async/await;
- Keychain;
- ATS;
- App Attest;
- observabilidade;
- testes unitários, snapshots e UI tests.

**Módulos sugeridos:**

```text
App
CoreDesign
CoreNetworking
CoreSecurity
CoreObservability
CoreStorage
FeatureAuthentication
FeatureOnboarding
FeatureHome
FeatureAccounts
FeatureTransactions
FeaturePix
FeatureTransfers
FeatureCards
FeatureCredit
FeatureInvestments
FeatureProfile
FeatureSupport
```

---

### 5.4 Windows Operations

**Público:** funcionários, analistas, operadores, compliance, fraude, tesouraria e auditoria.

**Este canal não é uma versão ampliada do aplicativo do cliente.**

**Módulos:**

- visão operacional;
- clientes e relacionamentos;
- KYC e documentos;
- casos AML;
- fraude;
- transações;
- Pix;
- cartões;
- crédito;
- disputas;
- ledger read-only controlado;
- conciliação;
- contabilidade;
- relatórios;
- atendimento;
- gestão de limites;
- bloqueios;
- aprovações;
- auditoria;
- usuários e permissões;
- incidentes;
- saúde das integrações.

**Arquitetura recomendada:**

- .NET/WinUI ou Tauri com frontend web controlado;
- SSO corporativo;
- MFA resistente a phishing;
- RBAC + ABAC;
- segregação de funções;
- aprovação por quatro olhos;
- trilha de consulta;
- mascaramento de dados;
- exportações controladas;
- assinatura de código;
- distribuição MSIX/MDM.

**Regra crítica:**

Nenhum operador deve alterar saldo diretamente. Ajustes financeiros passam por workflows formais, dupla aprovação e lançamentos compensatórios no ledger.

---

### 5.5 APIs Parceiros

**Público:** fintechs, empresas, marketplaces, integradores e participantes autorizados.

**Produtos possíveis:**

- consulta de conta;
- consulta de saldo;
- extrato;
- iniciação de Pix;
- cobrança;
- Pix recebido;
- webhooks;
- cartões corporativos;
- crédito embarcado;
- conciliação;
- identidade;
- consentimentos;
- dados agregados;
- onboarding B2B.

**Arquitetura recomendada:**

- API Gateway dedicado;
- OAuth 2.1/OIDC;
- mTLS;
- scopes;
- consentimento;
- client credentials;
- FAPI quando aplicável;
- OpenAPI;
- AsyncAPI;
- webhooks assinados;
- idempotência;
- rate limiting;
- quotas por parceiro;
- portal de desenvolvedores;
- sandbox;
- catálogo de erros;
- versionamento;
- relatórios de consumo;
- processo de certificação.

**Exemplo de produto:**

```text
POST /v1/pix/payments
Idempotency-Key: ...
Authorization: Bearer ...
X-Correlation-ID: ...
```

O parceiro recebe um identificador de operação. A liquidação continua pertencendo ao domínio Pix e ao ledger.

---

## 6. Design System multiplataforma

O HTML contém a identidade visual inicial, mas a produção exige um Design System formal.

### 6.1 Fonte da verdade

- Figma Libraries;
- design tokens em repositório;
- Storybook para Web;
- catálogo Compose para Android;
- catálogo SwiftUI para iOS;
- catálogo Windows;
- documentação de acessibilidade;
- versionamento semântico.

### 6.2 Tokens

```text
color
typography
spacing
radius
border
elevation
opacity
motion
breakpoints
z-index
iconography
data-visualization
```

### 6.3 Componentes obrigatórios

- buttons;
- inputs;
- currency input;
- account selector;
- transaction row;
- status badge;
- cards;
- bottom sheets;
- modal;
- confirmation screen;
- receipt;
- empty state;
- error state;
- loading/skeleton;
- offline state;
- step-up authentication;
- risk warning;
- consent;
- data masking;
- charts;
- tables;
- pagination;
- audit timeline;
- case panel.

### 6.4 Estados obrigatórios

Cada tela deve especificar:

```text
default
loading
partial loading
empty
offline
timeout
validation error
business rejection
technical failure
pending
processing
settled
reconciled
reversed
blocked
manual review
session expired
step-up required
maintenance
```

### 6.5 Regra visual

O visual azul/preto pode ser preservado, mas:

- contraste deve ser mensurável;
- efeitos não podem prejudicar leitura;
- movimento deve respeitar reduced motion;
- valores financeiros devem ter alta legibilidade;
- cores não podem ser o único indicador de estado;
- telas operacionais devem priorizar densidade e rastreabilidade;
- telas críticas devem reduzir efeitos decorativos.

---

## 7. Conversão dos 23 módulos em domínios reais

| Módulo visual | Domínio real | Canal principal | Prioridade |
|---|---|---|---|
| Home | Aggregation/BFF | Web/Android/iOS | P0 |
| Transações | Statements/Transactions | Web/Android/iOS/Ops | P0 |
| Pix | Payments/Pix/DICT/SPI | Web/Android/iOS/Ops/API | P0 |
| Transferências | Payments | Web/Android/iOS/Ops/API | P0 |
| Cartões | Cards/Authorization/Invoice | Web/Android/iOS/Ops/API | P0 |
| Profile | Identity/Devices/Security | Web/Android/iOS/Ops | P0 |
| Crédito | Credit Origination/Servicing | Todos | P1 |
| Investimentos | Orders/Custody/Suitability | Cliente/Ops/API | P1 |
| Protection | Insurance Partner Integration | Cliente/Ops/API | P2 |
| Crypto | Virtual Assets Program | Cliente/Ops/API | Programa separado |
| Analytics | Data Platform/Personal Finance | Cliente/Ops | P2 |
| Dreams | Goals/Scheduled Payments | Cliente | P2 |
| Kids | Dependent Accounts/Parental Control | Cliente/Ops | P2 |
| Senior | Assisted Banking/Safety | Cliente/Ops | P2 |
| Rewards | Loyalty | Cliente/API | P2 |
| Discounts | Benefits | Cliente/API | P3 |
| Marketplace | Commerce Partner Platform | Cliente/API | P3 |
| Events | Benefits/Experiences | Cliente/API | P3 |
| Travel | Concierge/Partner Platform | Cliente/API | P3 |
| Pets | Partner Ecosystem | Cliente/API | P3 |
| Sustainability | Analytics/Partners | Cliente/API | P3 |
| Academy | Content Platform | Cliente | P3 |
| Cloud | Remover do app bancário; plataforma separada | Internal/Enterprise | Fora do canal bancário |

---

## 8. Estrutura de repositórios

```text
regenera-bank/
├── apps/
│   ├── web-banking/
│   ├── android/
│   ├── ios/
│   ├── windows-operations/
│   └── partner-developer-portal/
│
├── bff/
│   ├── web-bff/
│   ├── mobile-bff/
│   ├── operations-bff/
│   └── partner-api-facade/
│
├── domains/
│   ├── identity/
│   ├── customers/
│   ├── accounts/
│   ├── ledger/
│   ├── transactions/
│   ├── payments/
│   ├── pix/
│   ├── cards/
│   ├── credit/
│   ├── investments/
│   ├── limits/
│   ├── fees/
│   ├── fraud/
│   ├── aml/
│   ├── reconciliation/
│   ├── accounting/
│   └── notifications/
│
├── contracts/
│   ├── openapi/
│   ├── asyncapi/
│   ├── json-schema/
│   ├── events/
│   ├── error-catalog/
│   └── test-vectors/
│
├── design-system/
│   ├── tokens/
│   ├── web/
│   ├── android/
│   ├── ios/
│   ├── windows/
│   └── documentation/
│
├── platform/
│   ├── terraform/
│   ├── kubernetes/
│   ├── networking/
│   ├── security/
│   ├── observability/
│   ├── data/
│   ├── backups/
│   └── disaster-recovery/
│
├── quality/
│   ├── contract-tests/
│   ├── e2e/
│   ├── performance/
│   ├── security/
│   ├── accessibility/
│   └── financial-invariants/
│
└── governance/
    ├── adr/
    ├── threat-models/
    ├── runbooks/
    ├── release/
    └── audit-evidence/
```

---

## 9. Topologia das equipes

### 9.1 Product Platform

- Principal Architect;
- Staff Backend Engineers;
- Domain Architects;
- Platform Engineers;
- Security Engineers;
- SRE;
- Database Engineers.

### 9.2 Experience Platform

- Head of Design;
- Design System Lead;
- Senior Product Designers;
- UX Research;
- Content Design;
- Accessibility Specialist;
- Design Technologists.

### 9.3 Web Banking Squad

- Engineering Manager;
- Staff Frontend;
- Senior Frontend Engineers;
- Senior Backend/BFF Engineers;
- QA Automation;
- Product Designer;
- Product Manager.

### 9.4 Mobile Banking Squad

Pode ser dividida em Android e iOS.

- Staff Android;
- Senior Android Engineers;
- Staff iOS;
- Senior iOS Engineers;
- Mobile Security Engineer;
- QA Mobile;
- Product Designer;
- Product Manager.

### 9.5 Operations Squad

- Staff Full-stack/.NET;
- Senior Frontend;
- Senior Backend;
- Workflow Engineer;
- Data/Reporting Engineer;
- QA;
- Operations Product Designer;
- Product Manager.

### 9.6 Partner Platform Squad

- Staff API Engineer;
- Senior Backend;
- IAM Engineer;
- Developer Experience Engineer;
- Technical Writer;
- QA/Contract Testing;
- Partner Solutions Architect;
- Product Manager.

### 9.7 Domain Squads

- Identity/KYC;
- Accounts/Ledger;
- Payments/Pix;
- Cards;
- Credit;
- Investments;
- Fraud/AML;
- Accounting/Reconciliation.

---

## 10. Fluxo de trabalho obrigatório

Nenhuma tela deve entrar em desenvolvimento apenas a partir do HTML.

```text
1. Product brief
2. Jornada e service blueprint
3. Modelo de domínio
4. Threat model
5. Contrato de API
6. Estados funcionais
7. Design de alta fidelidade
8. Protótipo validado
9. Implementação de backend
10. Implementação por canal
11. Contract tests
12. Testes de segurança
13. Testes E2E
14. Observabilidade
15. Runbook
16. Homologação
17. Release progressivo
```

---

## 11. Backlog estrutural por épicos

### EPIC 00 — Engenharia de fundação

- convenções;
- estratégia de branches;
- CODEOWNERS;
- pipelines;
- ambientes;
- secrets;
- observabilidade;
- feature flags;
- artifact signing;
- SBOM;
- templates;
- ADRs;
- catálogo de erros.

### EPIC 01 — Design System

- extração de tokens;
- tipografia;
- cores;
- superfícies;
- inputs;
- botões;
- navegação;
- data display;
- formulários;
- estados;
- acessibilidade;
- bibliotecas por canal.

### EPIC 02 — Identity and Device Trust

- cadastro de credenciais;
- login;
- MFA;
- biometria;
- device binding;
- sessões;
- recuperação;
- risco de acesso;
- logout remoto;
- dispositivos autorizados.

### EPIC 03 — Onboarding/KYC

- cadastro;
- CPF/CNPJ;
- documentos;
- selfie;
- prova de vida;
- endereço;
- renda;
- termos;
- casos pendentes;
- backoffice de revisão.

### EPIC 04 — Accounts and Home

- contas;
- saldo;
- saldo disponível;
- bloqueios;
- agregação da home;
- preferências;
- cache controlado;
- máscaras;
- estados de indisponibilidade.

### EPIC 05 — Transactions and Statements

- extrato;
- paginação;
- detalhes;
- comprovantes;
- filtros;
- exportação;
- categorização;
- status financeiros.

### EPIC 06 — Pix and Transfers

- chaves;
- consulta;
- envio;
- recebimento;
- QR;
- copia e cola;
- limites;
- agendamento;
- devolução;
- fraude;
- conciliação;
- backoffice;
- APIs.

### EPIC 07 — Cards

- cartões;
- bloqueio;
- cartão virtual;
- limites;
- fatura;
- autorizações;
- parcelamentos;
- contestação;
- backoffice;
- webhooks.

### EPIC 08 — Windows Operations

- IAM corporativo;
- pesquisa de cliente;
- dossiê;
- casos;
- aprovações;
- auditoria;
- filas de trabalho;
- relatórios;
- integrações;
- saúde operacional.

### EPIC 09 — Partner APIs

- portal;
- onboarding de parceiro;
- credenciais;
- sandbox;
- API catalog;
- webhooks;
- quotas;
- logs;
- certificação;
- suporte.

### EPIC 10 — Production Readiness

- performance;
- resilience;
- chaos;
- pentest;
- disaster recovery;
- load test;
- runbooks;
- alertas;
- SLOs;
- release gates;
- rollback.

---

## 12. Contratos antes das telas

Exemplo de contrato de saldo:

```yaml
GET /v1/accounts/{accountId}/balances

responses:
  200:
    body:
      accountId: string
      currency: BRL
      bookBalance: decimal-string
      availableBalance: decimal-string
      blockedBalance: decimal-string
      asOf: RFC3339
```

Exemplo de criação Pix:

```yaml
POST /v1/pix/payments

headers:
  Idempotency-Key: required
  X-Correlation-ID: required

request:
  sourceAccountId: string
  destination:
    keyType: CPF|CNPJ|EMAIL|PHONE|EVP
    key: string
  amount:
    currency: BRL
    value: decimal-string
  description: string

response:
  paymentId: string
  status: CREATED|RISK_REVIEW|AUTHORIZED|SENT|SETTLED|REJECTED|UNKNOWN
```

### Regra

Interfaces não devem traduzir falhas técnicas diretamente ao usuário. O backend fornece um catálogo estável de erros e códigos de ação.

---

## 13. Matriz de estados transacionais

Todos os canais devem interpretar a mesma máquina de estados:

```text
CREATED
VALIDATING
RISK_REVIEW
AUTHORIZED
FUNDS_RESERVED
SENT
ACCEPTED
SETTLED
RECONCILED
REJECTED
FAILED
UNKNOWN
REVERSED
CANCELLED
MANUAL_REVIEW
```

O texto exibido pode variar por canal, mas o estado de domínio é único.

---

## 14. Segurança por canal

| Controle | Web | Android | iOS | Windows Ops | APIs |
|---|---|---|---|---|---|
| MFA | Sim | Sim | Sim | Obrigatório | Conforme grant |
| Device binding | Parcial | Obrigatório | Obrigatório | Managed device | Certificado/client |
| Secure storage | Cookie/servidor | Keystore | Keychain | Windows secure store | Vault |
| Attestation | Navegador/risco | Play Integrity | App Attest | MDM/EDR | mTLS |
| CSP/WAF | Obrigatório | Gateway | Gateway | Gateway/VPN | Obrigatório |
| RBAC/ABAC | Cliente | Cliente | Cliente | Forte | Scopes/policies |
| Step-up | Sim | Sim | Sim | Sim | Conforme operação |
| Audit | Sim | Sim | Sim | Completo | Completo |

---

## 15. Qualidade e Definition of Done

Uma funcionalidade só está concluída quando:

- domínio aprovado;
- contrato versionado;
- design aprovado;
- acessibilidade verificada;
- threat model atualizado;
- backend implementado;
- web implementada quando aplicável;
- Android implementado quando aplicável;
- iOS implementado quando aplicável;
- Windows implementado quando aplicável;
- API de parceiro implementada quando aplicável;
- testes unitários;
- testes de integração;
- contract tests;
- E2E;
- testes de falha;
- observabilidade;
- dashboards;
- alertas;
- logs sem dados sensíveis;
- runbook;
- rollback;
- evidências anexadas;
- aprovação de segurança;
- aprovação de produto;
- release progressivo validado.

---

## 16. Plano inicial de 90 dias

### Dias 1–30 — Fundação

**Produto e Design**

- inventariar as 23 telas;
- criar mapa de jornadas;
- separar banco, ecossistema e módulos fora de escopo;
- extrair tokens;
- criar biblioteca Figma;
- desenhar estados ausentes;
- definir acessibilidade.

**Engenharia**

- criar repositórios;
- criar ADRs;
- definir arquitetura;
- configurar CI;
- configurar ambientes;
- definir contratos;
- criar mock server;
- definir observabilidade;
- iniciar Identity e Design System.

**Entregáveis**

- Product Architecture Map;
- Domain Map;
- Design System v0.1;
- OpenAPI baseline;
- protótipo navegável revisado;
- threat model de canais;
- estrutura de repositórios.

### Dias 31–60 — Vertical Slice real

Construir uma fatia completa:

```text
Login
→ Home
→ Conta
→ Saldo
→ Extrato
→ Detalhe
→ Logout
```

Incluindo:

- backend;
- BFF;
- Web;
- Android;
- iOS;
- Windows read-only;
- observabilidade;
- autenticação;
- testes.

A primeira fatia não movimenta dinheiro, mas já deve usar infraestrutura e padrões definitivos.

### Dias 61–90 — Primeira transação controlada

Construir:

```text
Pix interno entre duas contas de homologação
```

Incluindo:

- intenção;
- idempotência;
- risco básico;
- reserva;
- postings no ledger;
- confirmação;
- extrato;
- comprovante;
- evento;
- notificação;
- conciliação interna;
- backoffice;
- auditoria.

O objetivo é provar o ciclo financeiro completo antes de conectar o SPI.

---

## 17. Ondas posteriores

### Onda A — Foundation Banking

- Identity;
- Onboarding;
- Accounts;
- Ledger;
- Home;
- Statements;
- Internal Transfers;
- Windows Operations básico.

### Onda B — Payments

- Pix;
- DICT;
- SPI;
- limites;
- fraude;
- reconciliação;
- Partner APIs de pagamento.

### Onda C — Cards

- emissão;
- autorização;
- limites;
- fatura;
- clearing;
- chargeback;
- wallets.

### Onda D — Credit and Wealth

- crédito;
- servicing;
- investimentos;
- suitability;
- custódia;
- relatórios.

### Onda E — Ecosystem

- Kids;
- Senior;
- Dreams;
- Rewards;
- Benefits;
- Travel;
- Marketplace;
- Academy;
- Sustainability.

### Programas separados

- criptoativos;
- conta global/câmbio;
- seguros;
- Regenera Cloud.

---

## 18. Primeiros tickets que devem ser abertos

1. `ARCH-001` — Criar arquitetura de referência dos canais.
2. `ARCH-002` — Definir BFFs e fronteiras de domínio.
3. `DESIGN-001` — Extrair design tokens do HTML.
4. `DESIGN-002` — Inventariar componentes e estados.
5. `DESIGN-003` — Criar biblioteca Figma.
6. `CONTRACT-001` — Definir modelo comum de erros.
7. `CONTRACT-002` — Definir Account/Balance API.
8. `CONTRACT-003` — Definir Transaction API.
9. `IDENTITY-001` — Definir fluxo de login e sessão.
10. `SEC-001` — Threat model de Web Banking.
11. `SEC-002` — Threat model Android/iOS.
12. `OPS-001` — Definir RBAC/ABAC do Windows Operations.
13. `PARTNER-001` — Definir modelo OAuth/mTLS.
14. `WEB-001` — Criar shell Web Banking.
15. `ANDROID-001` — Criar arquitetura modular Android.
16. `IOS-001` — Criar arquitetura modular iOS.
17. `WINDOWS-001` — Criar shell Windows Operations.
18. `QA-001` — Criar estratégia de testes multiplataforma.
19. `OBS-001` — Definir telemetria e correlation IDs.
20. `RELEASE-001` — Criar pipeline assinado de homologação.

---

## 19. Decisões não negociáveis

1. O HTML não será empacotado como aplicativo final.
2. O ledger será a fonte financeira da verdade.
3. Nenhum canal acessará banco de dados diretamente.
4. Nenhuma chave ficará em código, ZIP ou frontend.
5. Valores monetários não usarão `float`.
6. Toda transação terá idempotência.
7. Todo fluxo crítico terá estado `UNKNOWN`.
8. Todo evento terá versão e correlation ID.
9. Operações privilegiadas terão segregação de funções.
10. Design System será versionado e multiplataforma.
11. Web, Android e iOS terão segurança específica de plataforma.
12. Windows Operations será um produto operacional separado.
13. APIs Parceiros terão sandbox, certificação e quotas.
14. Observabilidade e runbooks serão parte da entrega.
15. Produção será liberada apenas por gates técnicos e operacionais.

---

## 20. Critério de sucesso da primeira fase

A primeira fase estará completa quando a equipe conseguir demonstrar, em ambiente de homologação:

```text
Cliente autenticado em Web, Android e iOS
→ consulta uma conta real de homologação
→ visualiza saldo derivado do ledger
→ consulta extrato paginado
→ operação aparece no Windows Operations
→ todos os eventos possuem correlation ID
→ API e canais passam em contract tests
→ logs e métricas permitem rastrear a jornada
→ nenhuma informação financeira é simulada no frontend
```

Esse é o primeiro ponto em que o Regenera Bank deixa de ser apenas um protótipo visual e passa a existir como plataforma bancária.
