# PLANO DE AÇÃO REVISADO - REGENERA BANK

## Sprint 1B (CRÍTICO)
*Meta: Completar issues CRÍTICAS para a estabilidade e conformidade da plataforma.*

- [x] **COMP-001:** Finalizar fluxo de consentimento LGPD (API e registro de auditoria).
- [x] **COMP-002:** Implementar tokenização de cartões (PCI Compliance).

---

## Sprint 2 (ALTA PRIORIDADE)
*Meta: Fortalecer a segurança e a performance da aplicação.*

- [x] **SEC-003:** Garantir o uso de cookies `httpOnly` para tokens de sessão.
- [x] **SEC-004:** Implementar Rate Limiting em endpoints sensíveis (auth, transações).
- [x] **SEC-005:** Configurar política de CORS restritiva.
- [x] **SEC-006:** Adicionar headers de segurança (CSP, HSTS, X-Frame-Options).
- [x] **PERF-003:** Implementar pool de conexões com o Redis para otimizar latência.

---

## Sprint 3 (MODERADA PRIORIDADE)
*Meta: Pagar débitos técnicos, melhorar a cobertura de testes e a documentação.*

- [~] **TECH-DEBT:** Resolver 10 issues de prioridade `MODERATE`. *(Nota: Issues não especificadas, não acionável.)*
- [x] **DOCS:** Documentar os principais fluxos da API (Swagger/OpenAPI).
- [x] **TESTS:** Criar suíte de testes End-to-End (E2E) para os fluxos críticos.
