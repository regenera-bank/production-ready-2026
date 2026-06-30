# Saldo não autoritativo

**Estado:** aceito  
**Responsável:** Don Paulo Ricardo  
**Revisão independente:** pendente

## Contexto

Canal financeiro carrega intenção, identidade e consequência. A fronteira precisa falhar sem inventar verdade.

## Alternativas

1. controle explícito por canal;
2. abstração genérica compartilhada;
3. delegação integral ao cliente.

## Decisão

Canal nunca calcula saldo final.

## Razão

Cache local melhora latência, mas não substitui ledger.

## Consequência

Modo offline exibe último estado com marca temporal.

## Rollback

Rollback só ocorre com contrato compatível, evidência de sessão e prova de que nenhuma intenção ficou sem estado conclusivo.
