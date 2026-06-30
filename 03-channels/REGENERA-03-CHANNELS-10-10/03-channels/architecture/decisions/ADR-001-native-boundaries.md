# Fronteiras nativas

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

Manter Web, Android e iOS como canais distintos.

## Razão

WebView único reduziria custo inicial e concentraria risco de sessão, armazenamento e acessibilidade.

## Consequência

Custo maior de manutenção. Ganho em controle de plataforma.

## Rollback

Rollback só ocorre com contrato compatível, evidência de sessão e prova de que nenhuma intenção ficou sem estado conclusivo.
