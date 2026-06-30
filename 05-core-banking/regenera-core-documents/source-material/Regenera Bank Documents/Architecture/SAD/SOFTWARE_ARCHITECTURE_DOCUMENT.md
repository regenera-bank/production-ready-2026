# Software Architecture Document (SAD): O Mapa Estratégico do Regenera Bank

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Estratégico  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Audiência:** Arquitetos, CTOs, Auditores  
**Referência:** Análise Arquitetural Completa (Certificação 10/10)

---

### **1. Introdução: A Visão da Regeneração Codificada**

Este Software Architecture Document (SAD) serve como o mapa estratégico do Regenera Bank, destilando a complexidade de nosso ecossistema de microsserviços em uma representação clara e compreensível. Ele não é um detalhamento linha a linha do código, mas um guia conceitual que ilustra como os módulos se comunicam, como os dados fluem e quais decisões técnicas fundamentais foram tomadas para garantir a excelência, segurança e resiliência da nossa plataforma.

---

### **2. Contexto do Sistema (Modelo C4 - Nível 1: Visão Contextual)**

Nosso sistema, o Regenera Bank, é uma plataforma de serviços financeiros digitais.

*   **Usuários Principais:**
    *   **Clientes (Pessoas Físicas/Jurídicas):** Interagem via `next-frontend` (web) e `mobile-app`. Realizam operações financeiras (login, PIX, transferências, pagamentos, investimentos).
    *   **Parceiros Externos:** Consomem APIs específicas para integração com sistemas externos (ex: APIs de Open Banking, processadores de pagamento).
    *   **Equipes Internas (Admin/Suporte):** Utilizam painéis de administração específicos (não detalhados aqui) para gestão e suporte.
*   **Sistemas Externos:**
    *   **SPI/BACEN:** Sistema de Pagamentos Instantâneos (PIX) do Banco Central do Brasil.
    *   **Provedores de Email/SMS:** Para notificações.
    *   **Serviços Regulatórios:** Para KYC/AML (validação de identidade, antilavagem de dinheiro).
    *   **Serviços de Terceiros:** Para AI/Chatbot, análise de risco, etc.

**(Diagrama Contextual - Textual)**
```
+----------------+       +-------------------+       +---------------------+
| Clientes       |------>| Regenera Bank     |<------| Parceiros Externos  |
| (Web/Mobile)   |       | (Sistema Principal) |       | (APIs)              |
+----------------+       +-------------------+       +---------------------+
                                   ^
                                   |
                                   |
                         +-------------------+
                         | Equipes Internas  |
                         | (Admin/Suporte)   |
                         +-------------------+
```
```
+-------------------+       +--------------------+
| Regenera Bank     |<------>| SPI/BACEN          |
| (Sistema Principal) |       | Provedores Externos|
+-------------------+       +--------------------+
```

---

### **3. Contêineres (Modelo C4 - Nível 2: Visão de Contêiner)**

O sistema Regenera Bank é composto por múltiplos "contêineres" (aplicações e serviços implantáveis) que se comunicam.

*   **Aplicações de Cliente:**
    *   `Next.js Frontend`: Aplicação Web principal (Next.js, React).
    *   `Mobile App`: Aplicação mobile nativa (React Native/Flutter).
*   **Ponto de Entrada (API Gateway):**
    *   `api-gateway`: Microsserviço NestJS. Ponto de entrada único para todas as requisições externas. Realiza roteamento, rate limiting, autenticação de borda.
*   **Microsserviços de Backend (NestJS, TypeScript):**
    *   `auth-service`: Gerencia autenticação (JWT) e autorização.
    *   `user-service`: Gerencia dados de usuários e perfis.
    *   `account-service`: Gerencia contas e saldos.
    *   `transaction-service`: Gerencia transações financeiras e audit trail.
    *   `pix-service`: Gerencia transferências PIX (implementa padrão SAGA).
    *   `card-service`: Gerencia cartões (crédito/débito).
    *   `investment-service`: Gerencia portfólios e operações de investimento.
    *   `notification-service`: Envio de e-mails, SMS, push notifications.
    *   `analytics-service`: Coleta e processa dados para BI e métricas.
    *   `ai-service`: Chatbot e serviços de IA humanizada.
    *   `compliance-service`: KYC/AML, LGPD, validações regulatórias.
    *   `blockchain-service`: Funcionalidades de audit trail e tokenização baseadas em blockchain (opcional).
*   **Bancos de Dados e Armazenamento:**
    *   `PostgreSQL`: Banco de dados relacional primário (para `user-service`, `account-service`, `transaction-service`, `pix-service`, `card-service`, `investment-service`). Implementado com RDS Multi-AZ e Read Replicas.
    *   `MongoDB`: Banco de dados NoSQL (para `analytics-service`, `ai-service`, logs de eventos, perfis de usuário extensos).
    *   `Redis`: Cache de alta velocidade e filas de mensagens auxiliares.
    *   `Elasticsearch`: Motor de busca para logs (`analytics-service`) e buscas complexas.
*   **Mensageria:**
    *   `RabbitMQ`: Message broker para comunicação assíncrona entre microsserviços (padrão Event-Driven).

**(Diagrama de Contêineres - Textual - Simplificado)**
```
+-----------------------------------------------------------------------+
| Regenera Bank (Sistema)                                               |
|                                                                       |
|  +----------------+      +----------------+      +------------------+ |
|  | Next.js Frontend |----->| API Gateway    |<-----| Mobile App       | |
|  +----------------+      +----------------+      +------------------+ |
|                                   |                                     |
|                                   v (REST/gRPC via Istio)               |
|  +----------------+      +----------------+      +------------------+ |
|  | Auth Service   |<----->| User Service   |<---->| Account Service  | |
|  | (gRPC Client)  |      |                |      |                  | |
|  +----------------+      +----------------+      +------------------+ |
|        ^                      ^       ^                 ^             |
|        | (gRPC)               |       |                 |             |
|        v                      v       v                 v             |
|  +-----------------------------------------------------------------------+
|  | RabbitMQ (Event Bus)  <---> Transaction Service <---> PIX Service  |
|  +-----------------------------------------------------------------------+
|        ^                              ^          ^                      |
|        |                              |          |                      |
|  +-----------------------------------------------------------------------+
|  | PostgreSQL    MongoDB    Redis    Elasticsearch (Data Stores)       |
|  +-----------------------------------------------------------------------+
```

---

### **4. Componentes (Modelo C4 - Nível 3: Visão de Componente - Exemplo: `auth-service`)**

Zoom no microsserviço `auth-service`, responsável pela autenticação de usuários.

**(Diagrama de Componentes - Textual para `auth-service`)**
```
+----------------------------------------------------------+
| Auth Service (Microsserviço NestJS)                      |
|                                                          |
|  +------------------+      +--------------------------+  |
|  | Auth Controller  |----->| Auth Service             |  |
|  | (REST/gRPC Entry)|      | (Lógica de Negócio)      |  |
|  +------------------+      +--------------------------+  |
|          ^                           |                     |
|          |                           | (gRPC Call)         |
|          |                           v                     |
|          |                  +--------------------------+  |
|          |                  | User Service gRPC Client |  |
|          |                  | (Invoca user-service)    |  |
|          |                  +--------------------------+  |
|          |                           ^                     |
|          |                           | (gRPC)              |
|          v                           |                     |
|  +----------------+          +--------------------------+  |
|  | JWT Guard      |          | Bcrypt (Validação Senha) |  |
|  | (Valida Token) |          +--------------------------+  |
|  +----------------+          +--------------------------+  |
|                          | JWT Service (Gera Token) |  |
|                          +--------------------------+  |
|                                                          |
+----------------------------------------------------------+
```
*   **`AuthController`**: Recebe requisições HTTP (Login, Register, Profile) do API Gateway e delega para o `AuthService`.
*   **`AuthService`**: Contém a lógica de negócio principal para autenticação.
    *   Faz chamadas gRPC para o `user-service` via `UserServiceGrpcClient` para buscar dados do usuário.
    *   Usa `Bcrypt` para comparar hashes de senha.
    *   Usa `JwtService` para gerar e assinar JWTs.
*   **`UserServiceGrpcClient`**: Interface e cliente gRPC para comunicação com o `user-service` (usa `user.proto`).
*   **`JWT Guard`**: Componente de segurança que protege rotas, validando a presença e validade de tokens JWT.

---

### **5. Fluxos de Dados Críticos**

#### **5.1. Fluxo de Autenticação (Login)**
1.  **Frontend (Next.js/Mobile App):** Usuário insere credenciais.
2.  **API Gateway:** Recebe `POST /auth/login`, roteia para `auth-service`.
3.  **Auth Service:**
    *   Recebe requisição.
    *   Faz chamada gRPC `findOneByEmail` para `user-service`.
4.  **User Service:**
    *   Busca usuário em `PostgreSQL`.
    *   Retorna dados do usuário (incluindo `passwordHash`) via gRPC.
5.  **Auth Service:**
    *   Compara senha fornecida com `passwordHash` (Bcrypt).
    *   Gera JWT (`access_token`).
    *   Retorna JWT ao API Gateway, que repassa ao Frontend.
6.  **Frontend:** Armazena JWT, redireciona para dashboard.

#### **5.2. Fluxo de Transação (PIX - Padrão SAGA Orquestrado)**
1.  **Frontend:** Usuário inicia transferência PIX.
2.  **API Gateway:** Recebe requisição, roteia para `pix-service`.
3.  **PIX Service (Orquestrador da SAGA):**
    *   **STEP 1:** Integração com SPI/BACEN (sistema externo).
    *   **STEP 2:** `account-service` débita conta origem (transação local). Publica evento.
    *   **STEP 3:** `account-service` credita conta destino (transação local). Publica evento.
    *   **STEP 4:** `transaction-service` persiste registro completo da transação PIX.
    *   **STEP 5:** `notification-service` envia notificação de sucesso/falha.
    *   **Compensação:** Se qualquer passo falhar (ex: crédito na Conta B falha), transações compensatórias (ex: estorno do débito na Conta A) são acionadas em cascata, revertendo o estado para consistência eventual.

---

### **6. Decisões Técnicas Chave e Justificativas**

*   **Arquitetura de Microsserviços + Monorepo (pnpm):** Desacoplamento de domínios, escalabilidade independente, mas com gerenciamento centralizado de dependências e tooling.
*   **Kubernetes (AWS EKS):** Orquestração de contêineres para escalabilidade, auto-healing e resiliência em nuvem.
*   **Comunicação Híbrida (gRPC + REST + RabbitMQ):** `gRPC` para alta performance e tipagem forte entre microsserviços (contratos `.proto`), `REST` via API Gateway para APIs públicas, `RabbitMQ` para comunicação assíncrona e Event-Driven, garantindo desacoplamento.
*   **Persistência Poliglota:** Uso estratégico de PostgreSQL (transacional), MongoDB (documental/analítico), Redis (cache/sessão) e Elasticsearch (busca/logs) para otimizar o armazenamento conforme o caso de uso.
*   **Resiliência Integrada:**
    *   **Service Mesh (Istio):** mTLS para criptografia/autenticação de serviço-a-serviço e Circuit Breakers (outlier detection) para prevenir falhas em cascata.
    *   **RDS Multi-AZ + Read Replicas:** Alta disponibilidade e escalabilidade de leitura para bancos de dados relacionais.
    *   **Failover Automatizado (Route 53 Health Checks):** RTO < 5 minutos garantido por roteamento DNS inteligente.
*   **Segurança em Camadas (Defense in Depth):**
    *   **WAF + Rate Limiting (API Gateway):** Proteção na borda.
    *   **JWT:** Autenticação stateless de usuários.
    *   **IAM Roles for Service Accounts (IRSA) + CSI Secrets Store:** Injeção segura de segredos em pods Kubernetes.
    *   **Network Policies:** Restrição de tráfego entre microsserviços no EKS.
*   **Qualidade e Observabilidade:**
    *   **Testes de Contrato:** Garantia de compatibilidade de APIs entre microsserviços.
    *   **Chaos Engineering:** Injeção controlada de falhas em produção para validar a resiliência.
    *   **Observabilidade Total:** Logs (Kibana), Métricas (Prometheus/Grafana), Traces (Jaeger) para MTTR baixo.
*   **Precisão Financeira:** Aritmética de inteiros para todos os valores monetários (centavos) para evitar erros de ponto flutuante, crucial para conformidade e confiança.

---

### **7. Conclusão: Um Sistema Construído para Durar e Inovar**

Este SAD demonstra que a arquitetura do Regenera Bank é um testemunho da excelência em engenharia de software, construída sobre princípios sólidos de segurança, resiliência, escalabilidade e governança. Cada decisão técnica foi tomada para garantir um sistema que não apenas atenda às rigorosas demandas do setor financeiro, mas que também esteja preparado para a inovação e o crescimento futuros, de forma previsível e auditável.
