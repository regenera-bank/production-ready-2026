# Modelo de ameaça

**Documento:** CH-SEC-001

## Ativos

- sessão autenticada;
- intenção financeira;
- vínculo de dispositivo;
- credencial de parceiro;
- ação operacional privilegiada;
- trilha de auditoria.

## Ameaças e controles

| Ameaça | Canal | Controle | Falha segura |
|---|---|---|---|
| roubo de sessão | Web | cookie seguro, CSRF, rotação | revoga sessão |
| aplicativo adulterado | Mobile | attestation | bloqueia operação crítica |
| replay financeiro | Todos | idempotência | devolve resultado anterior |
| estado desconhecido | Todos | reconciliação | não repete automaticamente |
| autoaprovação | Operations | maker-checker | bloqueia ação |
| segredo de parceiro vazado | Partner | exibição única, rotação | revoga credencial |
| webhook repetido | Partner | nonce e timestamp | rejeita entrega |
| PII em telemetria | Todos | allowlist | descarta campo |

## Risco aceito

A baseline não homologa fornecedores externos.
Essa falta não é escondida.
É bloqueio de promoção.
