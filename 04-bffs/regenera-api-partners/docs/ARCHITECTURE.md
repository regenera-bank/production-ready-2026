# Arquitetura do canal

## Contrato operacional

O canal não mantém saldo autoritativo, não decide fraude e não executa lançamento contábil. Toda operação financeira termina no domínio responsável e retorna um estado canônico.

```text
canal → edge → BFF/facade → domínio → ledger → rede externa → conciliação
```

## Invariantes

- valores monetários são strings decimais no contrato;
- POST financeiro exige `Idempotency-Key`;
- toda chamada recebe `X-Correlation-ID`;
- token não entra em log;
- `UNKNOWN` não é convertido em falha;
- retry automático não é aplicado a comandos financeiros;
- produção falha fechada quando autenticação, attestation ou configuração não estão disponíveis.
