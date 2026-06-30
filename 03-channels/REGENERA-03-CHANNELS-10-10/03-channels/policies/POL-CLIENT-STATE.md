# Política de estado no cliente

**Documento:** CH-POL-STATE-001  
**Estado:** vigente na baseline técnica  
**Owner:** channel-engineering  
**Revisão:** trimestral

## Objetivo

Impedir que projeção local seja confundida com verdade financeira.

## Escopo

Aplica-se aos cinco canais ativos, bibliotecas compartilhadas, pipelines e artefatos distribuídos.

## Controles obrigatórios

- saldo não autoritativo;
- idempotency key em mutação;
- correlation ID em comando;
- UNKNOWN exige reconciliação;
- retry somente após falha conclusiva;

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
