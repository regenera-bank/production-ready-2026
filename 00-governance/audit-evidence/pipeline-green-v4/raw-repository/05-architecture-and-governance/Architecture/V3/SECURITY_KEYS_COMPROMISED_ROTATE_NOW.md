# SEGREDOS EXPOSTOS — ROTACIONAR AGORA

Este arquivo não repete segredo.
Auditoria não redistribui munição.

## Situação

Chaves e URLs sensíveis apareceram em logs, mensagens, `.env`, scripts ou documentação.
Mesmo quando parecem de teste, entram como comprometidas.

Não discute.
Rotaciona.

## Ação obrigatória

| Item | Ação |
|---|---|
| Database URL Neon | rotacionar usuário/senha, revogar credencial antiga, atualizar Secret Manager |
| JWT secret | gerar novo segredo forte, invalidar tokens antigos, registrar janela de corte |
| Prometeo sandbox key | rotacionar se o provedor permitir, senão restringir e registrar exceção |
| Firebase/GCP keys | restringir por domínio, App Check, APIs permitidas, monitoramento |
| Gemini key | não usar chave web no backend sem política clara, separar credencial |
| GitHub secrets | limpar histórico, revisar Actions, não escrever valor em YAML |
| Vercel env | separar `VITE_*` público de segredo real |

## Regra

Segredo em chat não volta limpo.
Segredo em git não volta limpo.
Segredo em script não volta limpo.

Rotação é recibo.
Sem rotação, é fé.
Fé não passa em auditoria.
