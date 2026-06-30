# V3 — CIRURGIA DO PACOTE

Backend é juiz. Controller não decide dinheiro.

## Regra

- preservar o que funciona
- matar segredo exposto
- matar mock em runtime
- adicionar teste antes de mexer em contrato
- manter tom curto e explícito
- não quebrar Vercel nem pipeline verde

## Checklist

- [ ] sem `.env` real
- [ ] sem `node_modules`
- [ ] sem chave literal
- [ ] sem regra financeira na UI
- [ ] sem endpoint sem contrato
- [ ] sem doc sem dono
- [ ] com teste do caminho crítico
- [ ] com erro de negócio por código estável

## Frase

Não é refazer porque falhou.
É refazer porque ainda não virou nosso.
