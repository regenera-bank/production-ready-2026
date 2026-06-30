# ADR-0002: Consolidação e Delegação de Domínios Ausentes na Árvore Canônica

**Data:** 25 de Junho de 2026
**Status:** Aceito
**Contexto:**
Durante a auditoria P0 (`AUDITORIA-COMPLETA-MAPA-REGENERA-FALTANTES.md`), identificou-se que 17 domínios conceituais (como onboarding, device-trust, session, etc.) não possuíam pastas dedicadas na estrutura de microserviços (`05-core-banking` e `06-risk-control`). 
A fim de manter a arquitetura enxuta e evitar a "explosão de microserviços", precisamos decidir se criamos pastas isoladas para cada um ou delegamos essas responsabilidades para domínios já existentes.

**Decisão:**
Em vez de criar novos microserviços físicos isolados, decidimos delegar formalmente essas capacidades para os domínios mapeados, adotando a estratégia de "Módulos Lógicos dentro de Bounded Contexts maiores":

1. **`onboarding`**: Absorvido por `regenera-core-customers`. O onboarding é o ciclo de vida inicial do customer.
2. **`device-trust` e `session`**: Absorvidos por `regenera-core-identity`. Confiança de dispositivo e sessão são sub-domínios de identidade.
3. **`documents`**: Absorvido por `regenera-core-customers` (KYC docs) e `10-platform/regenera-platform-object-storage`.
4. **`balance` e `statements`**: Absorvidos por `regenera-core-ledger` (para extratos precisos) e `regenera-core-accounts` (para views de saldo em cache).
5. **`consents`**: Absorvido por `12-regulatory/regenera-regulatory-open-finance`.
6. **`payment-orchestrator`**: Absorvido por `regenera-core-pix` e futuros domínios de `transfers` como módulos de roteamento.
7. **`card-authorization` e `card-clearing`**: Absorvidos por `regenera-core-cards` como ports de integração interna.
8. **`invoices` e `disputes`**: Absorvidos por `regenera-core-cards` (faturas) e `regenera-core-transactions` (disputas).
9. **`loan-servicing` e `credit-decision`**: Absorvidos por `regenera-risk-credit`.
10. **`product-catalog`**: Absorvido estaticamente em `regenera-core-fees` e `regenera-core-accounts`.
11. **`fx` (Câmbio)**: Removido do escopo P0. Se necessário, será um novo domínio futuro `regenera-core-fx`.
12. **`custody-positions`**: Absorvido por `regenera-core-investments`.
13. **`customer-support` e `case-management`**: Absorvidos por `14-operations/regenera-operations-customer-support`.
14. **`audit`**: Absorvido nativamente na malha da infraestrutura via `regenera-platform-observability`.
15. **`regulatory-reporting`, `cosif`, `sanctions`**: Absorvidos por `06-risk-control/regenera-control-regulatory-reporting` e `regenera-risk-sanctions`.

**Consequências:**
- Redução na complexidade de orquestração.
- Maior coesão dentro dos bounded contexts principais.
- Requisitos da auditoria P0 cumpridos sem inchar o cluster Kubernetes.
