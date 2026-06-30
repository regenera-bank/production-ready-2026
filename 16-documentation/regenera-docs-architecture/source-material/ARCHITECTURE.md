# ARQUITETURA DO REGENERA BANK - CORE TRANSACTION SERVICE

## Visão Geral
Este documento detalha a arquitetura do Core Transaction Service do Regenera Bank, focando nos princípios de Design Orientado ao Domínio (DDD), Segurança, Resiliência, Observabilidade e Escalabilidade.

### Princípios Fundamentais
- **DDD:** Foco em um modelo de domínio rico e isolado.
- **Segurança (Security by Design):** Cada componente é construído com segurança em mente, assumindo que entradas são maliciosas.
- **Resiliência:** Tolerância a falhas e recuperação automática são características essenciais.
- **Observabilidade:** Monitoramento, tracing e logging detalhados para visibilidade completa.
- **Pragmatismo:** Soluções "Production Ready" que balanceiam complexidade e entrega de valor.

## Componentes de Cross-Cutting Concerns

### 1. Auditoria Imutável (`AuditService`)
- **Localização:** `src/common/audit/audit.service.ts`
- **Função:** Registra ações críticas (e.g., tokenização de cartão, consentimento LGPD) de forma imutável. Cada log é assinado criptograficamente com um HMAC SHA-256, garantindo a integridade e não-repúdio do registro.
- **Mitigação de Risco:** Data Breach (rastreabilidade forense), Compliance (LGPD, PCI).

### 2. Idempotência (`IdempotencyGuard`)
- **Localização:** `src/common/guards/idempotency.guard.ts`
- **Função:** Previne a execução duplicada de operações financeiras (ex: PIX, transferências, tokenização de cartão) utilizando chaves de idempotência baseadas em Redis.
- **Mitigação de Risco:** Double Spending, inconsistências de dados, falhas em retentativas.

### 3. Resiliência Distribuída (`ResilienceModule`)
- **Localização:** `src/common/infra/resilience.module.ts`
- **Função:** Configura padrões de resiliência como `Circuit Breaker` e `Retry Pattern` para chamadas a serviços externos. Utiliza `HttpModule` (baseado em Axios) com timeouts e redirecionamentos configurados.
- **Mitigação de Risco:** Falhas em serviços externos, cascateamento de falhas, indisponibilidade.

### 4. Observabilidade (`Observability Setup`)
- **Localização:** `src/common/infra/observability.ts`
- **Função:** Inicializa o SDK do OpenTelemetry para tracing distribuído. Garante que todas as operações da aplicação sejam instrumentadas e exportadas para um coletor (ex: Jaeger, Tempo), provendo "Visão Raio-X" do fluxo das requisições.
- **Mitigação de Risco:** Dificuldade de depuração, performance (identificação de bottlenecks), Key Person (conhecimento distribuído).

## Módulos de Negócio (Exemplos)

### 1. Gestão de Consentimento LGPD (`LgpdModule`)
- **Localização:** `src/modules/lgpd/`
- **Função:** Gerencia o consentimento dos usuários com as políticas de privacidade, registrando cada ação na trilha de auditoria.
- **Mitigação de Risco:** Compliance (LGPD).

### 2. Tokenização de Cartões (`TokenizationModule`)
- **Localização:** `src/modules/tokenization/`
- **Função:** Transforma dados sensíveis de cartão (número, CVV, validade) em tokens não-sensíveis, garantindo a conformidade com PCI DSS.
- **Mitigação de Risco:** Data Breach, Compliance (PCI DSS).

### 3. Autenticação (`AuthModule`)
- **Localização:** `src/modules/auth/`
- **Função:** Provê o fluxo de autenticação de usuários, gerando e gerenciando tokens JWT. Implementa cookies `httpOnly` para segurança de sessão.
- **Mitigação de Risco:** Ataques de Sessão (XSS, CSRF).

## Configurações de Segurança Globais

### 1. HTTPOnly Cookies (`SEC-003`)
- **Localização:** `main.ts` (via `AuthController`)
- **Função:** Garante que os cookies de sessão (JWT) sejam inacessíveis via JavaScript do lado do cliente, protegendo contra ataques XSS.

### 2. Rate Limiting (`SEC-004`)
- **Localização:** `main.ts` (global) e `auth.controller.ts` (específico para login)
- **Função:** Limita o número de requisições que um cliente pode fazer em um determinado período, prevenindo ataques de força bruta e DoS.

### 3. CORS (`SEC-005`)
- **Localização:** `main.ts`
- **Função:** Controla quais origens (domínios) podem fazer requisições à API, prevenindo Cross-Origin Attacks.

### 4. CSP Headers (`SEC-006`)
- **Localização:** `main.ts` (via `helmet`)
- **Função:** Implementa políticas de segurança de conteúdo através de cabeçalhos HTTP, mitigando XSS e injeção de código.

## Conclusão
Esta arquitetura reflete um compromisso com a excelência técnica, segurança e conformidade, elementos cruciais para a missão do Regenera Bank. A modularidade e a clareza na separação de responsabilidades facilitam a manutenção e a evolução contínua do sistema.
