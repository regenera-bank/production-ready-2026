# Estado UNKNOWN

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

Bloquear repetição automática e encaminhar para consulta/reconciliação.

## Razão

Repetir parece disponibilidade. Em pagamento pode virar duplicidade.

## Consequência

A interface precisa explicar espera sem prometer falha ou sucesso.

## Rollback

Rollback só ocorre com contrato compatível, evidência de sessão e prova de que nenhuma intenção ficou sem estado conclusivo.
