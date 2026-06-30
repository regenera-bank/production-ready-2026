# Plano de Testes Idempotency
- Envio simultâneo via jMeter (mesma key, mesmo tempo) para testar lock/409.
- Falha no commit da transação principal deve retornar a state machine para FAILED_RETRYABLE.
