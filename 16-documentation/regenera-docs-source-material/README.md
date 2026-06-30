# Regenera Bank - Gold Master Monorepo

## 1. Visão Geral

Este repositório contém a infraestrutura de software "Gold Master" para o Regenera Bank. Ele é estruturado como um monorepo gerenciado pelo `pnpm workspaces` para garantir a máxima coesão, manutenibilidade e escalabilidade dos nossos sistemas.

O código aqui presente segue os mais altos padrões de engenharia de software para o setor financeiro, priorizando segurança, estabilidade e conformidade.

**Arquiteto Responsável:** Don Paulo Ricardo

---

## 2. Princípios Fundamentais (The Don Standard)

- **Domain-Driven Design (DDD):** As aplicações são divididas em domínios de negócio claros. A lógica de negócio reside em `packages/core` e nos módulos de domínio do back-end, nunca no front-end.
- **Segurança em Primeiro Lugar:** Nenhuma lógica de negócio sensível (ex: validação, análise de fraude, cálculos financeiros) deve existir no lado do cliente. Todas essas operações devem ser realizadas pelo back-end através de APIs seguras e autenticadas.
- **Imutabilidade e Tipos de Valor:** Para operações financeiras, utilizamos o Value Object `Money` (`packages/core/src/value-objects/money.ts`), que opera com inteiros para evitar os erros de precisão de ponto flutuante. Todas as operações com `Money` retornam uma nova instância, garantindo a imutabilidade.
- **Estrutura de Monorepo:** Utilizamos `pnpm workspaces` para gerenciar dependências de forma eficiente e garantir que `apps` e `packages` possam compartilhar código de forma segura e versionada.
- **Strictest TypeScript:** A configuração `tsconfig.base.json` impõe as regras mais estritas do TypeScript para minimizar a ocorrência de erros em tempo de execução.
- **Comunicação Inter-Serviços Robusta:** Para comunicação assíncrona, utilizamos um Message Queue (RabbitMQ). Para comunicação síncrona de alta performance entre microsserviços, implementamos gRPC.
- **Persistência Poliglota:** Utilizamos PostgreSQL para dados transacionais, MongoDB para dados não estruturados (eventos de Analytics), ElasticSearch para auditoria e logs imutáveis, e Redis para cache e *rate limiting*.
- **Resiliência:** Implementação de padrões de resiliência como Circuit Breaker para isolar falhas entre microsserviços.

---

## 3. Estrutura do Repositório

O monorepo é dividido em duas categorias principais de diretórios:

### `apps/`
Contém as aplicações executáveis.

- `apps/frontend`: O Dashboard em React SPA, o cliente web principal.
- `apps/next-frontend`: O cliente web Next.js (em desenvolvimento).
- `apps/mobile-app`: O cliente mobile em React Native (em desenvolvimento).
- `apps/services/`: Contém todos os microserviços NestJS implementados:
    - `api-gateway`: Ponto de entrada público, roteia requisições para os microsserviços e implementa *rate limiting* com Redis. **Documentação Swagger/OpenAPI disponível em `http://localhost:3000/api/docs`**
    - `auth-service`: Gerencia autenticação de usuários (registro, login, JWT) e se comunica com `user-service` via gRPC.
    - `user-service`: Gerencia dados de usuários, persistindo em PostgreSQL e expondo interface gRPC.
    - `account-service`: Gerencia contas bancárias e saldos, persistindo em PostgreSQL.
    - `pix-service`: Orquestra transferências PIX, interage com `account-service` via HTTP e publica eventos no RabbitMQ, persistindo em PostgreSQL.
    - `card-service`: Gerencia cartões de pagamento (virtuais/físicos), persistindo em PostgreSQL.
    - `investment-service`: Gerencia portfólios de investimento, persistindo em PostgreSQL.
    - `notification-service`: Consome eventos do RabbitMQ para simular envio de notificações (preparado para integrar com Twilio/SES).
    - `analytics-service`: Consome eventos do RabbitMQ e persiste logs de eventos no MongoDB.
    - `ai-service`: Simula um assistente de IA (Rapha AI), preparado para integração com a API do Gemini.
    - `compliance-service`: Simula verificações de conformidade (AML/KYC), preparado para integração com bureaus de sanções.
    - `blockchain-service`: Persiste logs de auditoria em ElasticSearch, simulando um registro imutável.
    - `transaction-service`: Novo microserviço dedicado que consome eventos do RabbitMQ para simular lógicas de *Settlement* e Reconciliação, persistindo em PostgreSQL.

### `packages/`
Contém pacotes de código compartilhado, utilizados pelas `apps`.

- `packages/core`: Pacote fundamental que contém as definições de tipo, interfaces e *value objects* (como `Money`) compartilhados entre o front-end e o back-end. **Não contém lógica de React ou NestJS.**
- `packages/ui`: Contém componentes de UI (React) reutilizáveis, como `GlassCard`, que formam a base do nosso Design System.
- `packages/grpc-definitions`: Contém os arquivos `.proto` e definições para a comunicação gRPC entre os microserviços.
- `packages/resilience`: Contém implementações de padrões de resiliência, como Circuit Breaker.

### `infrastructure/`
Contém definições de infraestrutura como código (IaC).

- `infrastructure/aws/`: Arquivos Terraform (`.tf`) para definição de AWS ALB, CloudFront, WAF, KMS, Security Groups, EKS Cluster, RDS (PostgreSQL Multi-AZ), e DocumentDB (MongoDB compatible).
- `infrastructure/kubernetes/`: Exemplos de manifestos Kubernetes (`.yaml`) para deploy de microsserviços, incluindo HPA para auto-scaling.

### `.github/`
Contém definições de workflows de CI/CD.

- `.github/workflows/main.yml`: Exemplo de pipeline de CI/CD utilizando GitHub Actions.

---

## 4. Como Começar

### Pré-requisitos

- Docker Desktop (para PostgreSQL, RabbitMQ, Redis, MongoDB, ElasticSearch)
- Node.js (v18 ou superior)
- `pnpm` (habilitado via `corepack enable` ou `npm install -g pnpm`)
- `terraform` CLI (para aplicar as configurações de IaC AWS)

### Instalação

1.  Na raiz do monorepo, copie o arquivo de exemplo para suas variáveis de ambiente:
    ```bash
    cp .env.example .env
    ```
    **IMPORTANTE:** Preencha os valores de acordo com seu ambiente, especialmente a `JWT_SECRET` e as URLs de serviço, se precisar sobrescrever os padrões.

2.  Suba os contêineres do Docker (PostgreSQL, RabbitMQ, Redis, MongoDB, ElasticSearch):
    ```bash
    docker-compose up -d
    ```

3.  Na raiz do monorepo, execute o comando de instalação do `pnpm`. Ele irá instalar todas as dependências e fazer o link simbólico entre os pacotes do workspace:
    ```bash
    pnpm install
    ```

### Executando em Modo de Desenvolvimento

Para iniciar o front-end e **todos** os microserviços simultaneamente com *hot-reloading*, utilize o comando `dev` a partir da raiz:

```bash
# Inicia apps/frontend (Vite) e todos os microserviços NestJS em modo watch
pnpm dev
```

### 5. Microserviços e suas Portas

Aqui está a lista das portas padrão em que cada microserviço e front-end opera:

*   **Front-end (React SPA):** `http://localhost:5173`
*   **Next.js Frontend:** `http://localhost:3000` (Este Next.js app irá ser o ponto de entrada da porta 3000, o API Gateway então terá sua rota de /api/)
*   **API Gateway:** `http://localhost:3000/api` (Rota base para acesso aos microsserviços via proxy)
*   **API Gateway Docs:** `http://localhost:3000/api/docs` (Documentação interativa Swagger/OpenAPI)
*   **Auth Service:** `http://localhost:3001` (HTTP) & `localhost:50051` (gRPC)
*   **User Service:** `http://localhost:3002` (HTTP) & `localhost:50051` (gRPC)
*   **Account Service:** `http://localhost:3003`
*   **PIX Service:** `http://localhost:3004`
*   **Card Service:** `http://localhost:3005`
*   **Notification Service:** `http://localhost:3006` (Microservice RMQ)
*   **Investment Service:** `http://localhost:3007`
*   **Analytics Service:** `http://localhost:3008` (Microservice RMQ)
*   **AI Service:** `http://localhost:3009`
*   **Compliance Service:** `http://localhost:3010`
*   **Blockchain Service:** `http://localhost:3011`
*   **Transaction Service:** `http://localhost:3012` (Microservice RMQ)

---
*Copyright © 2025 Regenera Ecosystem. Todos os direitos reservados.*

---

## 6. Processos de Deploy e Auditoria

Esta seção documenta os processos críticos de deploy, verificação de integridade e backup. Estes scripts e procedimentos são a espinha dorsal da nossa estratégia de SRE (Site Reliability Engineering) e segurança.

### 6.1. Fluxo de Deploy Automatizado

O deploy manual está **proibido**. Utilizamos scripts padronizados para garantir consistência e rastreabilidade.

- **`deploy_testnet.sh`**
  - **Branch:** `develop`
  - **Ambiente:** Testnet / Staging.
  - **Objetivo:** Deploy rápido para validação de features.
  - **Processo:** Faz o pull do código, instala dependências, roda migrações e reinicia os serviços. Gera um manifesto de build (`dist/deployment_manifest.sha256`) para rastreabilidade.
  - **Uso:** `bash deploy_testnet.sh`

- **`deploy_mainnet.sh`**
  - **Branch:** `main`
  - **Ambiente:** Produção.
  - **Objetivo:** Deploy seguro, controlado e auditável para o ambiente de produção.
  - **Processo:**
    1.  **Confirmação Manual:** Exige confirmação explícita (`yes-prod`) para continuar.
    2.  **Modo Manutenção:** Ativa uma página de manutenção.
    3.  **Backup do Banco de Dados:** Tira um snapshot do banco de dados de produção antes de qualquer alteração.
    4.  **Verificação On-Chain:** (Simulado) Espera por confirmações de blocos na Polygon Mainnet se necessário.
    5.  **Build e Deploy:** Constrói as imagens de produção e reinicia os serviços de forma controlada.
    6.  **Snapshot Pós-Deploy:** Cria um "snapshot" de auditoria contendo:
        - O manifesto de hashes de todos os arquivos em produção (`live_manifest.sha256`).
        - Logs completos dos serviços no momento do deploy.
        - Verificação do manifesto para garantir que nada foi alterado.
    7.  **Desativa o Modo Manutenção.**
  - **Uso:** `bash deploy_mainnet.sh` (Apenas por pessoal autorizado via Bastion Host).

### 6.2. Scripts de Suporte e Verificação

Localizados no diretório `/scripts`.

- **`verify_deployment_integrity.sh`**
  - **Objetivo:** Gerar e verificar manifestos de hash (SHA-256) para garantir a integridade dos arquivos do projeto.
  - **Modos:**
    - `generate`: Cria um manifesto a partir do diretório do projeto.
    - `verify`: Compara um manifesto com os arquivos atuais no disco.
  - **Importância:** Fundamental para o snapshot pós-deploy e para auditorias forenses, garantindo que o código em produção é idêntico ao código versionado e buildado.

- **`backup-strategy.sh`**
  - **Objetivo:** Orquestrar a estratégia de "Triple Backup" do banco de dados de produção.
  - **Processo:**
    1.  **Backup Local:** Cria um dump local para recuperação rápida.
    2.  **Backup em Cloud Primária:** Envia o dump para um bucket S3 na região principal (e.g., `us-east-1`).
    3.  **Backup em Cloud de DR:** Envia o dump para um bucket S3 em uma região de Disaster Recovery (e.g., `us-west-2`).
  - **Execução:** Deve ser executado via `cron` em um host seguro.

### 6.3. Processo de Auditoria

A segurança do Regenera Bank depende de verificação contínua.

- **Auditoria de Deploy:** Cada deploy em produção gera um diretório de snapshot em `logs/mainnet-deploys/`. Este snapshot é a evidência imutável do que foi implantado e deve ser arquivado para auditorias futuras.
- **Auditoria Forense:** Em caso de incidente de segurança ou para auditorias de rotina, o `FORENSIC_AUDIT_CHECKLIST.md` deve ser utilizado como guia. O script `verify_deployment_integrity.sh` é a principal ferramenta para a Fase 1 deste checklist.
- **Documento de Referência:** Para o guia completo de auditoria, consulte: `Regenera Bank Documents/IaC & Security/FORENSIC_AUDIT_CHECKLIST.md`.
