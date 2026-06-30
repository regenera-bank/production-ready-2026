# Regenera Bank - Documentação Técnica Completa

**Autor:** Don Paulo Ricardo  
**Data:** Dezembro 2025  
**Versão:** 1.0.0

---

## Índice

1. [Relatório Técnico de Arquitetura](#1-relatório-técnico-de-arquitetura)
2. [Tutorial de Configuração do Ambiente de Desenvolvimento](#2-tutorial-de-configuração-do-ambiente-de-desenvolvimento)
3. [Resumo Conceitual para Público Não-Técnico](#3-resumo-conceitual-para-público-não-técnico)
4. [Plano de Implantação AWS](#4-plano-de-implantação-aws)
5. [Guia Passo a Passo - Setup Local Simplificado](#5-guia-passo-a-passo---setup-local-simplificado)

---

# 1. Relatório Técnico de Arquitetura

## 1.1 Visão Geral do Sistema

O Regenera Bank é uma plataforma bancária digital de alta disponibilidade construída como um **monorepo moderno** gerenciado pelo `pnpm workspaces`. A arquitetura segue os princípios do **Domain-Driven Design (DDD)** e implementa padrões de microsserviços para garantir escalabilidade, manutenibilidade e resiliência.

### Princípios Arquiteturais ("The Don Standard")

O sistema foi projetado seguindo rigorosos padrões de engenharia de software financeiro:

- **Domain-Driven Design (DDD):** Separação clara entre domínios de negócio, com lógica empresarial centralizada no backend
- **Security-First:** Zero lógica de negócio sensível no cliente; todas as operações críticas são serverside
- **Imutabilidade Financeira:** Uso de Value Objects como `Money` para operações precisas sem erros de ponto flutuante
- **Type Safety Máximo:** TypeScript com configuração mais estrita possível para minimizar erros em runtime
- **Persistência Poliglota:** Cada tipo de dado utiliza o banco mais adequado (PostgreSQL, MongoDB, ElasticSearch, Redis)
- **Resiliência:** Circuit Breakers e padrões de falha graceful para isolar problemas entre serviços

## 1.2 Estrutura do Monorepo

```
regenera-bank-monorepo/
├── apps/                      # Aplicações executáveis
│   ├── frontend/              # React SPA (Dashboard)
│   ├── next-frontend/         # Next.js App (em desenvolvimento)
│   ├── mobile-app/            # React Native (em desenvolvimento)
│   └── services/              # Microsserviços NestJS
│       ├── api-gateway/       # Gateway principal (porta 3000)
│       ├── auth-service/      # Autenticação JWT (porta 3001)
│       ├── user-service/      # Gestão de usuários (porta 3002)
│       ├── account-service/   # Contas bancárias (porta 3003)
│       ├── pix-service/       # Transferências PIX (porta 3004)
│       ├── card-service/      # Cartões de pagamento (porta 3005)
│       ├── notification-service/  # Notificações assíncronas (porta 3006)
│       ├── investment-service/    # Investimentos (porta 3007)
│       ├── analytics-service/     # Analytics de eventos (porta 3008)
│       ├── ai-service/            # Assistente Rapha AI (porta 3009)
│       ├── compliance-service/    # AML/KYC (porta 3010)
│       ├── blockchain-service/    # Auditoria imutável (porta 3011)
│       └── transaction-service/   # Settlement (porta 3012)
├── packages/                  # Código compartilhado
│   ├── core/                  # Types, interfaces, Value Objects
│   ├── ui/                    # Componentes React reutilizáveis
│   ├── grpc-definitions/      # Definições gRPC (.proto)
│   ├── resilience/            # Circuit Breakers
│   ├── apm/                   # APM integrations
│   ├── config/                # Configurações compartilhadas
│   ├── logging/               # Sistema de logs
│   └── tracing/               # Distributed tracing
├── infrastructure/            # IaC e Kubernetes
│   ├── aws/                   # Terraform configs
│   └── kubernetes/            # Manifestos K8s
├── .github/                   # CI/CD workflows
├── docker-compose.yml         # Orquestração local
├── .env.example               # Template de variáveis
└── pnpm-workspace.yaml        # Configuração workspace
```

## 1.3 Arquitetura de Microsserviços

### 1.3.1 API Gateway

**Porta:** 3000  
**Responsabilidades:**
- Ponto de entrada unificado para todas as requisições externas
- Rate limiting usando Redis para proteção contra DDoS
- Roteamento inteligente para microsserviços apropriados
- Documentação Swagger/OpenAPI em `/api/docs`

**Stack Tecnológico:**
- NestJS framework
- Redis para cache e rate limiting
- JWT para autenticação de requisições
- OpenAPI/Swagger para documentação automática

### 1.3.2 Auth Service

**Portas:** 3001 (HTTP), 50051 (gRPC)  
**Responsabilidades:**
- Registro de novos usuários
- Autenticação via JWT
- Comunicação gRPC com User Service
- Gestão de sessões e tokens de refresh

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL para persistência de credenciais
- bcrypt para hashing de senhas
- gRPC para comunicação inter-serviços
- JWT (JSON Web Tokens)

### 1.3.3 User Service

**Portas:** 3002 (HTTP), 50051 (gRPC)  
**Responsabilidades:**
- Gerenciamento de perfis de usuários
- Armazenamento de dados pessoais
- Interface gRPC para consultas rápidas
- Validação de dados cadastrais

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL para dados estruturados
- TypeORM para ORM
- gRPC para alta performance

### 1.3.4 Account Service

**Porta:** 3003  
**Responsabilidades:**
- Gestão de contas bancárias
- Controle de saldos
- Histórico de transações
- Operações ACID para integridade financeira

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL com transações ACID
- TypeORM com migrations
- Value Object `Money` para precisão

### 1.3.5 PIX Service

**Porta:** 3004  
**Responsabilidades:**
- Orquestração de transferências PIX
- Integração com Account Service via HTTP
- Publicação de eventos no RabbitMQ
- Validação de chaves PIX

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL para persistência
- RabbitMQ para eventos assíncronos
- HTTP REST para comunicação síncrona

### 1.3.6 Card Service

**Porta:** 3005  
**Responsabilidades:**
- Gestão de cartões virtuais e físicos
- Controle de limites
- Bloqueio/desbloqueio de cartões
- Histórico de transações

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL para dados de cartões
- Criptografia para dados sensíveis

### 1.3.7 Notification Service

**Porta:** 3006  
**Responsabilidades:**
- Consumo de eventos do RabbitMQ
- Simulação de envio de notificações
- Preparado para integração com Twilio/AWS SES
- Suporte a múltiplos canais (email, SMS, push)

**Stack Tecnológico:**
- NestJS Microservices
- RabbitMQ consumer
- Preparado para Twilio e AWS SES

### 1.3.8 Investment Service

**Porta:** 3007  
**Responsabilidades:**
- Gestão de portfólios de investimento
- Cálculo de rentabilidade
- Alocação de ativos
- Histórico de operações

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL para dados de investimentos
- Value Objects para cálculos precisos

### 1.3.9 Analytics Service

**Porta:** 3008  
**Responsabilidades:**
- Consumo de eventos do RabbitMQ
- Persistência de logs de eventos no MongoDB
- Analytics em tempo real
- Geração de insights de uso

**Stack Tecnológico:**
- NestJS Microservices
- MongoDB para dados não estruturados
- RabbitMQ consumer
- Aggregation pipelines

### 1.3.10 AI Service (Rapha AI)

**Porta:** 3009  
**Responsabilidades:**
- Assistente virtual inteligente
- Preparado para integração com Gemini API
- Processamento de linguagem natural
- Suporte ao cliente automatizado

**Stack Tecnológico:**
- NestJS framework
- Preparado para Google Gemini API
- Redis para cache de respostas

### 1.3.11 Compliance Service

**Porta:** 3010  
**Responsabilidades:**
- Verificações AML (Anti-Money Laundering)
- Validações KYC (Know Your Customer)
- Preparado para integração com bureaus de sanções
- Análise de risco de transações

**Stack Tecnológico:**
- NestJS framework
- PostgreSQL para dados de compliance
- Preparado para APIs externas de sanções

### 1.3.12 Blockchain Service

**Porta:** 3011  
**Responsabilidades:**
- Logs de auditoria imutáveis
- Persistência no ElasticSearch
- Simulação de blockchain para compliance
- Rastreabilidade completa de operações

**Stack Tecnológico:**
- NestJS framework
- ElasticSearch para logs imutáveis
- Timestamping e hashing

### 1.3.13 Transaction Service

**Porta:** 3012  
**Responsabilidades:**
- Processamento de settlement
- Reconciliação de transações
- Consumo de eventos do RabbitMQ
- Lógica de compensação

**Stack Tecnológico:**
- NestJS Microservices
- PostgreSQL para transações
- RabbitMQ consumer
- Padrões de idempotência

## 1.4 Camada de Pacotes Compartilhados

### 1.4.1 packages/core

**Responsabilidade:** Biblioteca fundamental com tipos, interfaces e Value Objects compartilhados entre frontend e backend.

**Componentes Principais:**
- **Value Object Money:** Operações financeiras precisas usando inteiros
- **Types compartilhados:** DTOs, interfaces de domínio
- **Helpers utilitários:** Funções puras reutilizáveis
- **Validações de negócio:** Regras de domínio centralizadas

**Características:**
- Agnóstico a framework (sem React ou NestJS)
- 100% TypeScript strict mode
- Imutabilidade garantida
- Testabilidade máxima

### 1.4.2 packages/ui

**Responsabilidade:** Design System com componentes React reutilizáveis.

**Componentes:**
- `GlassCard`: Card com efeito glassmorphism
- `Button`: Botões estilizados com variantes
- `Input`: Campos de entrada com validação
- `Modal`: Modais consistentes
- Outros componentes de UI

**Stack:**
- React
- TypeScript
- CSS Modules ou Styled Components

### 1.4.3 packages/grpc-definitions

**Responsabilidade:** Definições Protocol Buffers para comunicação gRPC.

**Arquivos:**
- `user.proto`: Definições do User Service
- `auth.proto`: Definições do Auth Service
- Scripts de geração de código TypeScript

### 1.4.4 packages/resilience

**Responsabilidade:** Padrões de resiliência para microsserviços.

**Implementações:**
- **Circuit Breaker:** Isola falhas entre serviços
- **Retry policies:** Tentativas automáticas com backoff exponencial
- **Timeout handling:** Timeouts configuráveis
- **Fallback strategies:** Respostas alternativas em caso de falha

### 1.4.5 packages/apm

**Responsabilidade:** Integração com ferramentas de APM (Application Performance Monitoring).

**Suporte para:**
- New Relic
- Datadog
- Custom metrics
- Performance tracking

### 1.4.6 packages/tracing

**Responsabilidade:** Distributed tracing para debugging e observabilidade.

**Tecnologias:**
- OpenTelemetry
- Jaeger
- Correlation IDs
- Request tracing cross-service

### 1.4.7 packages/logging

**Responsabilidade:** Sistema de logging unificado.

**Características:**
- Logs estruturados em JSON
- Níveis configuráveis (debug, info, warn, error)
- Contexto de requisição
- Correlação entre serviços

## 1.5 Estratégias de Comunicação

### 1.5.1 Comunicação Síncrona

**HTTP REST:**
- Padrão para comunicação cliente-servidor
- API Gateway → Microsserviços
- PIX Service → Account Service

**gRPC:**
- Alta performance para comunicação inter-serviços
- Auth Service ↔ User Service
- Serialização eficiente com Protocol Buffers
- Type-safe por design

### 1.5.2 Comunicação Assíncrona

**RabbitMQ Message Queue:**
- Desacoplamento entre serviços
- Garantia de entrega de eventos
- Processamento assíncrono

**Fluxo de Eventos:**
1. PIX Service publica evento de transferência
2. Notification Service consome e envia notificação
3. Analytics Service consome e armazena no MongoDB
4. Transaction Service consome para settlement
5. Blockchain Service registra auditoria no ElasticSearch

## 1.6 Persistência Poliglota

### 1.6.1 PostgreSQL

**Uso:** Dados transacionais e estruturados  
**Serviços:**
- Auth Service (credenciais)
- User Service (perfis)
- Account Service (contas e saldos)
- PIX Service (transferências)
- Card Service (cartões)
- Investment Service (investimentos)
- Compliance Service (verificações)
- Transaction Service (settlements)

**Características:**
- Transações ACID
- Multi-AZ em produção (RDS)
- Backups automáticos
- Replicação para leitura

### 1.6.2 MongoDB

**Uso:** Dados não estruturados e analytics  
**Serviços:**
- Analytics Service (eventos)

**Características:**
- Schema flexível
- Alta performance para escrita
- DocumentDB compatible na AWS
- Aggregation pipelines para analytics

### 1.6.3 ElasticSearch

**Uso:** Logs de auditoria imutáveis  
**Serviços:**
- Blockchain Service (auditoria)

**Características:**
- Busca full-text
- Timestamping
- Imutabilidade
- Retenção configurável

### 1.6.4 Redis

**Uso:** Cache e rate limiting  
**Serviços:**
- API Gateway (rate limiting)
- Diversos serviços (cache)

**Características:**
- In-memory para alta velocidade
- TTL configurável
- Estruturas de dados avançadas
- Pub/Sub para eventos em tempo real

## 1.7 Segurança

### 1.7.1 Autenticação e Autorização

- **JWT (JSON Web Tokens):** Tokens stateless para autenticação
- **Refresh Tokens:** Renovação segura de sessões
- **bcrypt:** Hashing de senhas com salt
- **HTTPS Only:** Todas as comunicações criptografadas
- **API Keys:** Para serviços machine-to-machine

### 1.7.2 Proteções Implementadas

- **Rate Limiting:** Proteção contra DDoS no API Gateway
- **Input Validation:** Validação rigorosa de todos os inputs
- **SQL Injection Protection:** TypeORM parametrizado
- **XSS Prevention:** Sanitização de dados
- **CSRF Tokens:** Proteção contra CSRF
- **Secrets Management:** AWS KMS para chaves sensíveis

### 1.7.3 Compliance

- **PCI-DSS Ready:** Preparado para compliance de cartões
- **LGPD:** Proteção de dados pessoais
- **AML/KYC:** Verificações de compliance integradas
- **Audit Trails:** Logs imutáveis no Blockchain Service

## 1.8 Resiliência e Disponibilidade

### 1.8.1 Padrões de Resiliência

- **Circuit Breaker:** Isola falhas entre microsserviços
- **Retry com Exponential Backoff:** Tentativas inteligentes
- **Timeouts:** Limites de tempo para todas as operações
- **Fallbacks:** Respostas alternativas em caso de falha
- **Health Checks:** Monitoramento contínuo de saúde

### 1.8.2 Alta Disponibilidade

**Banco de Dados:**
- PostgreSQL Multi-AZ (RDS)
- Replicação read replicas
- Backups automáticos

**Kubernetes:**
- Multi-pod deployment
- Horizontal Pod Autoscaling (HPA)
- Liveness e Readiness probes
- Rolling updates zero-downtime

**AWS Infrastructure:**
- Application Load Balancer (ALB)
- CloudFront CDN
- Multiple Availability Zones
- Auto Scaling Groups

## 1.9 Observabilidade

### 1.9.1 Monitoramento

- **Métricas:** CPU, memória, latência, throughput
- **APM:** Application Performance Monitoring
- **Dashboards:** Grafana/CloudWatch
- **Alertas:** PagerDuty integration

### 1.9.2 Logging

- **Logs Estruturados:** JSON format
- **Centralized Logging:** ELK Stack ou CloudWatch
- **Log Levels:** debug, info, warn, error
- **Correlation IDs:** Rastreamento cross-service

### 1.9.3 Tracing

- **Distributed Tracing:** OpenTelemetry + Jaeger
- **Request Flow:** Visualização de fluxo entre serviços
- **Performance Profiling:** Identificação de bottlenecks

## 1.10 CI/CD Pipeline

### 1.10.1 GitHub Actions Workflow

**Stages:**

1. **Build and Test**
   - Checkout do código
   - Setup Node.js e pnpm
   - Install dependencies
   - Lint e Type Check
   - Testes unitários com coverage
   - Build de todos os microsserviços

2. **Build and Push Docker**
   - Autenticação AWS ECR
   - Build de imagens Docker para cada serviço
   - Tag e push para ECR
   - Versionamento com Git SHA

3. **Deploy Staging**
   - Deploy automático para ambiente staging
   - Aplicação de manifestos Kubernetes
   - Smoke tests
   - Rollout status check

4. **Deploy Production**
   - Aprovação manual obrigatória
   - Deploy para ambiente de produção
   - Blue-Green ou Canary deployment
   - Rollback automático em caso de falha

### 1.10.2 Estratégias de Deploy

- **Rolling Updates:** Atualização gradual sem downtime
- **Blue-Green:** Ambientes paralelos para switch instantâneo
- **Canary:** Deploy gradual com porcentagem de tráfego
- **Rollback Automático:** Em caso de health checks falharem

---

# 2. Tutorial de Configuração do Ambiente de Desenvolvimento

## 2.1 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

### Software Necessário

1. **Docker Desktop**
   - Versão: 4.0 ou superior
   - Download: https://www.docker.com/products/docker-desktop
   - Verifique: `docker --version` e `docker-compose --version`

2. **Node.js**
   - Versão: 18.0 ou superior
   - Download: https://nodejs.org/
   - Verifique: `node --version`

3. **pnpm**
   - Versão: 8.0 ou superior
   - Instalação: `corepack enable` ou `npm install -g pnpm`
   - Verifique: `pnpm --version`

4. **Git**
   - Versão: 2.30 ou superior
   - Download: https://git-scm.com/
   - Verifique: `git --version`

### Requisitos de Sistema

- **RAM:** Mínimo 8GB (recomendado 16GB)
- **Disco:** 10GB de espaço livre
- **SO:** Windows 10/11, macOS 10.15+, ou Linux (Ubuntu 20.04+)

## 2.2 Passo 1: Clone do Repositório

Abra seu terminal e navegue até o diretório onde deseja instalar o projeto:

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/regenera-bank-monorepo.git

# Entre no diretório do projeto
cd regenera-bank-monorepo
```

## 2.3 Passo 2: Configuração das Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configurar conexões e segredos. Siga estes passos:

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Agora abra o arquivo `.env` em seu editor de código favorito e revise as configurações. As configurações padrão já funcionam para desenvolvimento local:

```env
# Configurações essenciais
NODE_ENV=development
PORT=3000

# Database (já configurado para o Docker Compose)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=regenera_user
DATABASE_PASSWORD=regenera_password
DATABASE_NAME=regenera_bank

# RabbitMQ
RABBITMQ_HOST=localhost

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret (IMPORTANTE: Mude em produção!)
JWT_SECRET=REGENERA_BANK_SUPER_SECRET_KEY_FOR_DEMONSTRATION_ONLY
```

**⚠️ IMPORTANTE:**
- Em produção, **SEMPRE** altere o `JWT_SECRET` para um valor forte e único
- Nunca commite o arquivo `.env` no Git (já está no `.gitignore`)
- Use gerenciadores de secrets em produção (AWS Secrets Manager, Vault, etc.)

## 2.4 Passo 3: Inicialização dos Serviços Docker

O projeto utiliza Docker Compose para orquestrar todos os serviços de infraestrutura necessários:

```bash
# Suba todos os contêineres em modo detached (background)
docker-compose up -d
```

Este comando irá iniciar:
- **PostgreSQL** (porta 5432): Banco de dados principal
- **RabbitMQ** (portas 5672, 15672): Message queue
- **Redis** (porta 6379): Cache e rate limiting
- **MongoDB** (porta 27017): Analytics
- **ElasticSearch** (portas 9200, 9300): Auditoria

**Verificação dos Contêineres:**

```bash
# Liste os contêineres em execução
docker ps

# Você deve ver 5 contêineres rodando:
# - regenera_postgres_db
# - regenera_rabbitmq
# - regenera_redis
# - regenera_mongodb
# - regenera_elasticsearch
```

**Acessando Interfaces Web:**

- **RabbitMQ Management:** http://localhost:15672 (usuário: `guest`, senha: `guest`)
- **ElasticSearch:** http://localhost:9200

**Health Checks:**

Aguarde cerca de 30 segundos para todos os serviços ficarem saudáveis. Você pode verificar com:

```bash
# Check PostgreSQL
docker exec -it regenera_postgres_db pg_isready -U regenera_user

# Check Redis
docker exec -it regenera_redis redis-cli ping

# Check MongoDB
docker exec -it regenera_mongodb mongosh --eval "db.runCommand({ ping: 1 })"

# Check ElasticSearch
curl http://localhost:9200/_cat/health
```

## 2.5 Passo 4: Instalação das Dependências

Com os serviços Docker rodando, instale todas as dependências do monorepo:

```bash
# Execute a partir da raiz do projeto
pnpm install
```

Este comando irá:
- Instalar todas as dependências de `apps/*` e `packages/*`
- Criar links simbólicos entre os pacotes do workspace
- Configurar o monorepo para desenvolvimento

**O que esperar:**
- O processo pode levar de 2 a 5 minutos dependendo da sua conexão
- O `pnpm` é muito mais rápido que `npm` ou `yarn` graças ao sistema de hard links
- Você verá mensagens de progresso para cada workspace

**Verificação:**

```bash
# Liste os workspaces instalados
pnpm list --depth 0

# Verifique que todos os pacotes estão linkados
ls -la node_modules/@regenera
```

## 2.6 Passo 5: Inicialização do Banco de Dados

Antes de rodar a aplicação pela primeira vez, precisamos criar as tabelas no PostgreSQL:

```bash
# Execute as migrations do TypeORM
pnpm migration:run
```

Este comando irá:
- Conectar no PostgreSQL
- Criar todas as tabelas necessárias
- Aplicar os schemas de cada microsserviço

**Verificação:**

```bash
# Conecte-se ao PostgreSQL para verificar as tabelas
docker exec -it regenera_postgres_db psql -U regenera_user -d regenera_bank

# Dentro do psql, liste as tabelas:
\dt

# Você deve ver tabelas como:
# - users
# - accounts
# - pix_transactions
# - cards
# - investments
# etc.

# Saia do psql:
\q
```

## 2.7 Passo 6: Executando o Projeto

Agora vem a parte emocionante! Vamos iniciar todo o ecossistema:

```bash
# Execute todos os microsserviços e o frontend simultaneamente
pnpm dev
```

**O que acontece:**
- O frontend React SPA inicia na porta **5173** (Vite dev server)
- **13 microsserviços** NestJS iniciam cada um em sua porta respectiva
- Todos os serviços entram em modo **watch** (hot-reload automático)
- Logs de todos os serviços aparecem no terminal

**Logs Esperados:**

Você verá mensagens como:
```
[API Gateway] Listening on port 3000
[Auth Service] Listening on port 3001
[Auth Service] gRPC server running on port 50051
[User Service] Listening on port 3002
[Account Service] Listening on port 3003
[PIX Service] Listening on port 3004
...
[Frontend] Server running at http://localhost:5173
```

## 2.8 Passo 7: Verificação do Sistema

### 2.8.1 Acesse o Frontend

Abra seu navegador e acesse:

```
http://localhost:5173
```

Você deve ver a interface do Regenera Bank Dashboard.

### 2.8.2 Teste o API Gateway

Acesse a documentação Swagger do API:

```
http://localhost:3000/api/docs
```

Aqui você pode testar todos os endpoints interativamente.

### 2.8.3 Teste de Health Check

Teste se os serviços estão respondendo:

```bash
# Health check do API Gateway
curl http://localhost:3000/api/health

# Health check do Auth Service
curl http://localhost:3001/health

# Health check do User Service
curl http://localhost:3002/health
```

### 2.8.4 Teste de Registro de Usuário

Teste a criação de um usuário via API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@regenerabank.com",
    "password": "Senha@123",
    "nome": "Usuário Teste"
  }'
```

## 2.9 Comandos Úteis para Desenvolvimento

### Build de Produção

```bash
# Build todos os pacotes e serviços
pnpm build
```

### Testes

```bash
# Rodar todos os testes
pnpm test

# Testes com coverage
pnpm test:cov

# Testes de um serviço específico
pnpm --filter auth-service test
```

### Linting e Formatação

```bash
# Lint de todo o código
pnpm lint

# Fix automático de problemas de lint
pnpm lint:fix

# Formatação com Prettier
pnpm format
```

### TypeORM Migrations

```bash
# Criar uma nova migration
pnpm migration:create nome-da-migration

# Gerar migration a partir de mudanças nas entities
pnpm migration:generate nome-da-migration

# Executar migrations pendentes
pnpm migration:run

# Reverter última migration
pnpm migration:revert
```

### Docker Compose

```bash
# Ver logs de todos os contêineres
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f postgres_db

# Parar todos os contêineres
docker-compose stop

# Parar e remover todos os contêineres
docker-compose down

# Remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart postgres_db
```

### Desenvolvimento de Serviço Específico

```bash
# Rodar apenas o frontend
pnpm --filter frontend dev

# Rodar apenas um microsserviço
pnpm --filter auth-service dev

# Build de um serviço específico
pnpm --filter pix-service build
```

## 2.10 Troubleshooting

### Problema: Porta já em uso

**Sintoma:** Erro `EADDRINUSE: address already in use`

**Solução:**
```bash
# Descubra qual processo está usando a porta (exemplo: 3000)
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Mate o processo
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Problema: Docker não inicia

**Sintoma:** Contêineres Docker não sobem

**Soluções:**
1. Verifique se o Docker Desktop está rodando
2. Reinicie o Docker Desktop
3. Aumente a memória alocada para o Docker (Settings → Resources → Memory → 4GB+)

```bash
# Remova e recrie os contêineres
docker-compose down -v
docker-compose up -d
```

### Problema: Erro de conexão com banco de dados

**Sintoma:** `Connection refused` ou `ECONNREFUSED`

**Soluções:**
1. Verifique se o PostgreSQL está rodando:
```bash
docker ps | grep postgres
```

2. Teste a conexão:
```bash
docker exec -it regenera_postgres_db pg_isready
```

3. Verifique o arquivo `.env` e confirme as credenciais

### Problema: pnpm install falha

**Sintoma:** Erro durante `pnpm install`

**Soluções:**
1. Limpe o cache do pnpm:
```bash
pnpm store prune
```

2. Delete node_modules e reinstale:
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

3. Verifique a versão do Node.js:
```bash
node --version  # Deve ser 18+
```

### Problema: Hot reload não funciona

**Sintoma:** Mudanças no código não refletem automaticamente

**Soluções:**
1. Verifique se está usando `pnpm dev` (não `pnpm start`)
2. Reinicie o servidor de desenvolvimento
3. Limpe o cache do TypeScript:
```bash
rm -rf */*/dist  # Remove todos os builds
pnpm dev
```

## 2.11 Próximos Passos

Após configurar o ambiente com sucesso:

1. **Explore a Documentação:** Leia o README.md de cada microsserviço
2. **Teste a API:** Use a interface Swagger em http://localhost:3000/api/docs
3. **Estude o Código:** Comece pelo `packages/core` para entender os fundamentos
4. **Crie um Feature:** Escolha um microsserviço e adicione uma funcionalidade
5. **Escreva Testes:** Adicione testes para sua feature
6. **Faça um PR:** Siga o guia de contribuição

## 2.12 Recursos Adicionais

- **Documentação NestJS:** https://docs.nestjs.com
- **TypeORM Docs:** https://typeorm.io
- **RabbitMQ Tutorials:** https://www.rabbitmq.com/tutorials/
- **Docker Compose Reference:** https://docs.docker.com/compose/
- **pnpm Workspaces:** https://pnpm.io/workspaces

---

# 3. Resumo Conceitual para Público Não-Técnico

## 3.1 O que é o Regenera Bank?

Imagine o Regenera Bank como uma cidade digital ultra-moderna onde cada prédio tem uma função específica e todos trabalham juntos de forma harmoniosa. É um banco 100% digital, construído com as tecnologias mais avançadas da indústria de software, garantindo segurança máxima, disponibilidade 24/7 e escalabilidade infinita.

## 3.2 A Metáfora da Cidade Bancária

### O Monorepo: A Cidade

Pense no Regenera Bank como uma **cidade planejada** onde tudo está organizado e conectado. Não é um conjunto de construções aleatórias, mas sim um **distrito financeiro integrado** onde cada prédio (microsserviço) tem sua função específica.

### API Gateway: O Portão Principal

É como o **portão de segurança principal** da nossa cidade. Todo cliente que quer entrar precisa passar por aqui primeiro. O portão verifica sua identidade, decide para qual prédio você deve ir e controla quantas pessoas podem entrar ao mesmo tempo (para evitar superlotação).

**Analogia Real:** É como o saguão de um aeroporto internacional onde você passa pela imigração antes de acessar os terminais.

### Backend: Os Bastidores do Banco

Imagine que os serviços backend são os **bastidores** de um teatro. É onde toda a mágica acontece, mas o público (usuário) nunca vê. Aqui ficam:

- **A sala forte** (Account Service) onde os valores são guardados
- **O departamento de documentos** (User Service) com todos os cadastros
- **O setor de transferências** (PIX Service) que movimenta o dinheiro
- **A central de comunicação** (Notification Service) que avisa você de tudo

**Princípio Fundamental:** Todo o trabalho pesado e decisões importantes acontecem nos bastidores. O palco (frontend) apenas mostra o resultado final.

### Testes Automatizados: Inspetores Robôs

Pense nos testes como **robôs inspetores** que trabalham 24 horas por dia verificando se tudo funciona perfeitamente:

- **Inspetor de Qualidade:** Testa cada função individualmente (unit tests)
- **Inspetor de Integração:** Verifica se os prédios conversam direito (integration tests)
- **Inspetor de Experiência:** Simula um cliente usando todo o sistema (E2E tests)

**Analogia Real:** É como ter um exército de quality assurance que testa cada botão, cada transação, cada fluxo, milhares de vezes por dia, para garantir que nada quebre.

## 3.3 Os Prédios da Cidade (Microsserviços)

### 1. Prédio de Segurança (Auth Service)
**O que faz:** Controla quem pode entrar e dá os crachás de acesso (tokens JWT)  
**Analogia:** É o departamento de segurança que verifica sua identidade e te dá um passe para circular

### 2. Arquivo de Registros (User Service)
**O que faz:** Guarda todas as informações dos clientes  
**Analogia:** Como o cartório de registro civil, mantém todos os seus dados pessoais seguros

### 3. Cofre Principal (Account Service)
**O que faz:** Gerencia suas contas bancárias e saldos  
**Analogia:** O cofre do banco onde seu dinheiro está guardado e protegido

### 4. Sala de Transferências (PIX Service)
**O que faz:** Processa transferências instantâneas  
**Analogia:** Como o caixa expresso que envia dinheiro instantaneamente para outras pessoas

### 5. Departamento de Cartões (Card Service)
**O que faz:** Gerencia cartões virtuais e físicos  
**Analogia:** A sala onde você pode pedir novos cartões, bloqueá-los ou ajustar limites

### 6. Escritório de Investimentos (Investment Service)
**O que faz:** Cuida dos seus investimentos  
**Analogia:** Como uma corretora integrada onde você pode aplicar seu dinheiro

### 7. Central de Comunicação (Notification Service)
**O que faz:** Envia notificações e alertas  
**Analogia:** A central telefônica que te liga quando algo importante acontece

### 8. Sala de Análise (Analytics Service)
**O que faz:** Coleta e analisa dados de uso  
**Analogia:** O departamento de inteligência que entende padrões e melhora o serviço

### 9. Assistente Virtual (AI Service - Rapha)
**O que faz:** Oferece suporte automatizado inteligente  
**Analogia:** Como um atendente robô super inteligente que te ajuda 24/7

### 10. Departamento de Conformidade (Compliance Service)
**O que faz:** Garante que tudo está dentro das leis  
**Analogia:** O departamento jurídico que verifica cada operação

### 11. Sala de Registros Permanentes (Blockchain Service)
**O que faz:** Mantém registros imutáveis de auditoria  
**Analogia:** Como um livro-razão que nunca pode ser apagado ou alterado

### 12. Câmara de Compensação (Transaction Service)
**O que faz:** Processa a liquidação de transações  
**Analogia:** O departamento que confirma que o dinheiro realmente mudou de mãos

## 3.4 Os Túneis de Comunicação

### RabbitMQ: O Sistema de Metrô

Imagine um **sistema de metrô subterrâneo** que conecta todos os prédios da cidade. Quando um prédio precisa avisar outro sobre algo, coloca uma mensagem no metrô e ela chega instantaneamente.

**Exemplo Real:**
1. Você faz um PIX
2. O Prédio de PIX coloca uma mensagem no metrô dizendo "PIX enviado!"
3. Essa mensagem chega automaticamente em:
   - Central de Comunicação (te manda uma notificação)
   - Sala de Análise (registra a operação)
   - Sala de Registros (guarda para auditoria)

### gRPC: O Telefone Direto

É como ter um **telefone vermelho direto** entre dois prédios importantes que conversam muito. Quando o Prédio de Segurança precisa perguntar algo para o Arquivo de Registros, usa essa linha direta super rápida.

**Benefício:** Muito mais rápido que fazer o caminho normal pela recepção principal.

## 3.5 Os Guardiões da Cidade

### PostgreSQL: O Cofre de Dados Estruturados

Imagine um **arquivo gigante** com gavetas perfeitamente organizadas. Cada gaveta tem seu lugar e você pode encontrar qualquer documento em segundos.

**Uso:** Guarda informações importantes como:
- Dados de clientes
- Saldos de contas
- Histórico de transações
- Informações de cartões

### MongoDB: O Depósito Flexível

É como um **depósito moderno** onde você pode guardar caixas de qualquer tamanho ou formato. Perfeito para guardar informações que mudam de forma frequentemente.

**Uso:** Guarda dados de analytics e eventos do sistema.

### Redis: A Memória de Curto Prazo

Pense no Redis como a **memória RAM do banco**. É super rápido mas temporário. Guarda coisas que você precisa acessar instantaneamente, como:
- Quantas requisições um cliente já fez (para evitar spam)
- Dados que são acessados frequentemente

### ElasticSearch: A Biblioteca de História

É como uma **biblioteca gigante** onde cada página é registrada e nunca pode ser apagada. Perfeito para auditoria e conformidade.

**Uso:** Registra tudo que acontece no banco para nunca ser esquecido.

## 3.6 O Escudo Protetor

### Segurança em Camadas

Imagine o banco como um **castelo medieval** com múltiplas camadas de defesa:

**Camada 1 - O Fosso:** Firewall da AWS (WAF)  
**Camada 2 - A Muralha:** API Gateway com rate limiting  
**Camada 3 - Os Guardas:** Sistema de autenticação (JWT)  
**Camada 4 - As Portas Trancadas:** Criptografia de dados  
**Camada 5 - O Cofre:** Dados sensíveis com criptografia adicional  

### Circuit Breaker: O Fusível de Segurança

Imagine que um prédio da cidade começa a ter problemas. O **Circuit Breaker** é como um fusível elétrico que desliga temporariamente esse prédio para que ele não cause problemas nos outros.

**Analogia Real:** Quando o serviço de PIX está com problemas, ele é isolado temporariamente, mas você ainda pode usar cartões, ver seu saldo, etc.

## 3.7 A Infraestrutura Invisível

### Amazon Web Services (AWS): A Fundação

A AWS é como o **terreno e infraestrutura básica** onde construímos nossa cidade:

- **Energia:** Servidores sempre ligados
- **Água:** Rede de alta velocidade
- **Terreno:** Storage ilimitado
- **Segurança:** Guardas 24/7 (AWS Security)

### Kubernetes: O Sistema de Gerenciamento

É como ter um **prefeito robô super inteligente** que gerencia a cidade:

- **Detecta problemas:** Se um prédio cai, reconstrói automaticamente
- **Ajusta recursos:** Se muita gente chega, cria mais prédios temporários
- **Distribui trabalho:** Garante que nenhum prédio fique sobrecarregado

### Docker: As Construções Modulares

Pense em cada serviço como um **prédio pré-fabricado**. Você pode:
- Construir rapidamente
- Transportar para qualquer lugar
- Replicar quantas vezes quiser
- Substituir sem afetar os vizinhos

## 3.8 O Pipeline de Qualidade

### CI/CD: A Linha de Produção Automatizada

Imagine uma **fábrica ultra-moderna** que funciona assim:

**1. Desenvolvedor escreve código** → É como um arquiteto criando um projeto  
**2. GitHub Actions (Robôs Testadores)** → Robôs testam cada detalhe  
**3. Build Automático** → Constrói o prédio automaticamente  
**4. Deploy para Staging** → Testa na cidade de ensaio  
**5. Deploy para Produção** → Libera para a cidade real  

**Segurança:** Se algum teste falhar, nada vai para produção. É impossível quebrar o banco acidentalmente.

## 3.9 Por Que Isso Importa?

### Para o Cliente Final

**Velocidade:** Transações processadas em milissegundos  
**Disponibilidade:** Banco funciona 24/7/365 sem parar  
**Segurança:** Múltiplas camadas de proteção  
**Confiabilidade:** Sistema testado milhões de vezes antes de cada atualização  

### Para o Negócio

**Escalabilidade:** Pode crescer infinitamente sem reescrever código  
**Manutenibilidade:** Equipes podem trabalhar em paralelo sem conflitos  
**Resiliência:** Se um serviço falha, os outros continuam funcionando  
**Conformidade:** Auditoria completa de cada operação  

### Para os Desenvolvedores

**Produtividade:** Mudanças rápidas sem quebrar o sistema  
**Clareza:** Cada serviço tem uma responsabilidade clara  
**Testabilidade:** Fácil testar cada componente isoladamente  
**Documentação:** Código auto-documentado e Swagger para APIs  

## 3.10 O Futuro

O Regenera Bank é construído pensando no futuro:

- **Open Banking Ready:** Pronto para integrar com outros bancos
- **Blockchain Integration:** Preparado para Web3
- **AI-Powered:** Inteligência artificial em desenvolvimento (Rapha AI)
- **Global Scale:** Arquitetura pronta para expansão internacional

---

# 4. Plano de Implantação AWS

## 4.1 Visão Geral da Infraestrutura

O Regenera Bank será implantado na Amazon Web Services (AWS) seguindo as melhores práticas de infraestrutura como código (IaC) usando **Terraform** e orquestração de containers com **Amazon EKS (Elastic Kubernetes Service)**.

### Princípios de Design da Infraestrutura

1. **Multi-AZ (Availability Zones):** Alta disponibilidade em múltiplas zonas
2. **Infrastructure as Code:** Tudo definido em Terraform (versionável e reproduzível)
3. **Zero-Trust Security:** Mínimo privilégio em cada camada
4. **Auto-Scaling:** Escalabilidade automática baseada em demanda
5. **Disaster Recovery:** Backups automáticos e recuperação rápida
6. **Observability:** Monitoramento completo com CloudWatch

## 4.2 Arquitetura de Rede

### VPC (Virtual Private Cloud)

**Estrutura:**
```
Regenera Bank VPC (10.0.0.0/16)
├── Subnet Pública 1 (us-east-1a)  → 10.0.1.0/24
├── Subnet Pública 2 (us-east-1b)  → 10.0.2.0/24
├── Subnet Privada 1 (us-east-1a) → 10.0.10.0/24
├── Subnet Privada 2 (us-east-1b) → 10.0.11.0/24
├── Subnet de Dados 1 (us-east-1a) → 10.0.20.0/24
└── Subnet de Dados 2 (us-east-1b) → 10.0.21.0/24
```

**Componentes:**

- **Subnets Públicas:** ALB, NAT Gateway
- **Subnets Privadas:** EKS worker nodes, microsserviços
- **Subnets de Dados:** RDS, DocumentDB, ElastiCache

**Internet Gateway:** Permite comunicação com a internet  
**NAT Gateway:** Permite que recursos privados acessem a internet de forma segura  

## 4.3 Camada de Computação

### Amazon EKS (Elastic Kubernetes Service)

**Configuração:**

```terraform
resource "aws_eks_cluster" "regenera_eks_cluster" {
  name     = "regenera-bank-eks-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.28"

  vpc_config {
    subnet_ids         = [subnet_private_1, subnet_private_2]
    security_group_ids = [eks_cluster_sg]
  }

  enabled_cluster_log_types = [
    "api", "audit", "authenticator", 
    "controllerManager", "scheduler"
  ]
}
```

**Node Groups:**

```terraform
resource "aws_eks_node_group" "regenera_node_group" {
  cluster_name    = aws_eks_cluster.regenera_eks_cluster.name
  node_group_name = "regenera-node-group"
  
  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }

  instance_types = ["t3.large"]  # 2 vCPU, 8GB RAM
  
  # Auto-scaling baseado em CPU e memória
}
```

**Estratégia de Scaling:**
- **Min Nodes:** 2 (garantir alta disponibilidade)
- **Desired Nodes:** 3 (carga normal)
- **Max Nodes:** 10 (picos de tráfego)

### Container Registry (ECR)

Cada microsserviço ter