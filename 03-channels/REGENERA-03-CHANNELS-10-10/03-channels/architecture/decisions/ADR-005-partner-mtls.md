# mTLS para parceiros

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

Credencial de aplicação não basta. Certificado identifica origem.

## Razão

API key isolada é copiável e difícil de atribuir.

## Consequência

Rotação e revogação entram no processo operacional.

## Rollback

Rollback só ocorre com contrato compatível, evidência de sessão e prova de que nenhuma intenção ficou sem estado conclusivo.
