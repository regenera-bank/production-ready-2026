# Plano de Testes Pós-Merge

## 9. Tratamento de Falhas e UNKNOWN
- Circuit break na falha de Cognito garantindo status 503 (Serviço Indisponível) em vez de 401 para quedas.

## 10. Tipos de Testes
- **Unitários:** Cobertura > 90% para LocalJwtProvider e CognitoProvider isolados.
- **Integração:** Mock de Cognito para assegurar o roteamento do Factory.
- **Contrato:** Pact tests contra o BFF Mobile garantindo imutabilidade do payload.

## 11. Estratégia de Rollback
- Reverter a flag de infra para `AUTH_PROVIDER=LOCAL` em caso de erro na ativação em Staging.

## 12. Ordem de Alteração
1. Criar Interface.
2. Isolar Adapter A (JWT).
3. Validar Testes Unitários A.
4. Integrar Middleware.
5. Validar Testes Integração.
6. Criar Adapter B (Cognito).
7. Injetar via Factory.

