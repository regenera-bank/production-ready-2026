# Fluxo de dados

**Documento:** CH-ARCH-002

```text
Canal
  -> Edge
  -> BFF do canal
  -> Serviço de domínio
  -> Ledger / integração
  -> Conciliação
  -> BFF
  -> Canal
```

O canal recebe projeção.
Não recebe autoridade.

## Comando financeiro

1. canal gera `correlationId`;
2. canal gera `idempotencyKey`;
3. BFF autentica sessão e dispositivo;
4. domínio valida limite, fraude e estado;
5. ledger registra;
6. integração envia;
7. resposta pode ser conclusiva ou `UNKNOWN`;
8. `UNKNOWN` abre reconciliação. Não abre repetição automática.

## Dados sensíveis

Telemetria aceita identificador técnico.
Não aceita senha, token, chave Pix crua ou payload financeiro completo.
