# Runbook do canal

## Saúde

1. validar edge e DNS;
2. validar identidade e emissão de sessão;
3. validar BFF/facade;
4. validar dependências do core;
5. seguir `correlationId` ponta a ponta;
6. não repetir comando financeiro sem consultar o estado anterior.

## Timeout financeiro

Timeout não prova falha. Consultar a ordem pelo identificador. Se o estado permanecer `UNKNOWN`, encaminhar para reconciliação. Não recriar a ordem com nova chave antes da decisão operacional.

## Rollback

Rollback de canal não reverte lançamento. Operação financeira é compensada no domínio, nunca apagada pelo frontend.
