# Política de operações privilegiadas

**Documento:** CH-POL-OPS-001  
**Estado:** vigente na baseline técnica  
**Owner:** channel-engineering  
**Revisão:** trimestral

## Objetivo

Impedir ação crítica sem dupla decisão, motivo, prazo e prova.

## Escopo

Aplica-se aos cinco canais ativos, bibliotecas compartilhadas, pipelines e artefatos distribuídos.

## Controles obrigatórios

- maker-checker;
- PII mascarada;
- break-glass temporário;
- trilha encadeada;
- sessão privilegiada com expiração;

## Autoridade e segregação

O executor não aprova a própria mudança. O owner técnico responde pelo conteúdo. Segurança revisa identidade, sessão e exposição. Operações revisa rollback e observabilidade. Release Engineering preserva manifesto, hash e trilha.

## Gate bloqueante

A promoção falha quando falta owner, evidência, teste, revisão independente ou assinatura exigida. Falha não vira exceção por conversa. Exceção precisa de registro, compensação, aprovador diferente do autor e prazo de expiração.

## Evidência mínima

- diff revisado;
- resultado bruto dos testes;
- manifesto e checksums;
- inventário de dependências;
- decisão de aprovação;
- referência do ticket de mudança;
- assinatura externa quando aplicável.

## Métrica

A tolerância para efeito financeiro duplicado, segredo incorporado e retry cego em `UNKNOWN` é zero. Desvio bloqueante abre não conformidade e impede promoção.

## Revisão

Revisão trimestral e após incidente material. Alteração entra pelo mesmo gate da política original. Política vencida não continua válida por silêncio.
