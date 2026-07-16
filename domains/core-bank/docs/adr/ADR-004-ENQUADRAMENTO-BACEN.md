# ADR-004 — Enquadramento BACEN (Declarativo)

**Status:** Aceito  
**Data:** 2026-06-29  
**Domínio:** Core Banking + Pix  
**Autor:** Don Paulo Ricardo de Leão

## Contexto

O Regenera Bank implementa capacidades de instituição de pagamento e arranjos Pix em código verificável localmente. Licenças, homologação SPI/DICT e participação direta exigem processo regulatório e patrimônio que **não estão concluídos**.

## Decisão

1. Documentar obrigações com número de Resolução BACEN em `REGULATORY-TRACEABILITY.csv`
2. Status honesto: `PENDENTE_LICENCA`, `PENDENTE_HOMOLOGACAO`, `IMPLEMENTADO`, `IMPLEMENTADO_PARCIAL`
3. Homologação local usa mocks/adapters sandbox — nunca declarar SPI ativo em produção
4. E2E ID Pix segue formato BACEN com ISPB placeholder em homolog (`12345678`)

## Obrigações mapeadas (v1)

| ID | Regulação | Status |
|----|-----------|--------|
| REG-001 | IP — Res. BACEN 80/2021 | PENDENTE_LICENCA |
| REG-003 | SCD — Res. BACEN 4.656/2018 | PENDENTE_LICENCA |
| REG-004 | Pix Participante Direto | PENDENTE_HOMOLOGACAO |
| REG-002 | Sigilo — LC 105/2001 | IMPLEMENTADO |
| REG-007 | AML — Res. 4.753/2019 | IMPLEMENTADO |
| REG-008 | Cyber — Res. 4.658/2018 | IMPLEMENTADO_PARCIAL |

## Consequências

**Positivas**
- Due diligence distingue código pronto de produção bloqueada
- Evita declaração falsa de homologação
- Rastreabilidade regulatória por domínio

**Negativas**
- Pix live e SPI real permanecem bloqueados até licença
- ISPB placeholder não vale em produção

## Alternativas rejeitadas

| Alternativa | Motivo |
|-------------|--------|
| Omitir status regulatório | Viola Regra 9 |
| Simular homologação BACEN | Fraude de diligência |
| Adiar documentação até licença | Código sem rastreio |

## Referências

- AGENTS.md Regra 9, seção 10
- `EXTERNAL-BLOCKERS.md`
- MAPA_MESTRE fases A–E