# Objetivos de serviço dos canais

**Documento:** CH-SLO-001

| Indicador | Objetivo | Janela | Fonte | Ação |
|---|---:|---|---|---|
| disponibilidade Web | 99,95% | 30 dias | edge + synthetic | abrir SEV-2 abaixo do objetivo |
| autenticação p95 | 800 ms | 15 min | BFF | investigar em duas janelas |
| comando financeiro p95 | 1.500 ms | 15 min | BFF | degradar função não crítica |
| erro cliente 5xx | < 0,5% | 15 min | edge | abrir incidente |
| retry cego em UNKNOWN | 0 | contínua | evento de domínio | bloquear release |
| duplicidade financeira causada por canal | 0 | contínua | reconciliação | SEV-1 |
| ação crítica sem auditoria | 0 | contínua | audit store | SEV-1 |
| webhook sem assinatura | 0 | contínua | gateway parceiro | bloquear entrega |

Número sem fonte é decoração.
SLO sem ação é desejo.
