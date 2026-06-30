# REGENERA BANK - INCIDENT RUNBOOK (TIER 1 - CRÍTICO)

## 1. Escopo e Propósito
Este documento define os procedimentos de mitigação e recuperação (Disaster Recovery - DR) em caso de incidentes críticos, vazamento de dados, ataques DDoS ou falhas severas de consistência no Ledger/Pix.

## 2. Níveis de Incidente (SLO)
- **Nível 1 (Crítico):** Falha no gateway Pix, divergência no Ledger > R$ 0.00, ou queda de banco de dados (Tempo de resposta exigido: 5 minutos).
- **Nível 2 (Alto):** Latência > 500ms no Core Bancário, falha em dependência externa não-crítica.

## 3. Procedimentos Operacionais Padrão (SOP)

### 3.1. Divergência de Conciliação (Vigia Acionado)
1. O Job `ReconciliationCron` roda a cada hora e compara o saldo das entidades `Account` contra a soma imutável de `LedgerEntry`.
2. Em caso de fraude/divergência detectada (hash inválido, valores não batem):
   - **Ação Automática:** A conta suspeita recebe `status = 'FROZEN'`.
   - **Ação Manual:** Engenharia de Dados avalia os logs gerados na tabela de auditoria. 

### 3.2. Ataque DDoS ou Tráfego Anômalo
1. **Sirene (Observabilidade):** O alerta de volumetria no Grafana aciona PagerDuty caso exceda 5000 req/s.
2. **Mitigação:** 
   - Aumentar rigor do Rate Limiting no Ingress.
   - Cloudflare aciona modo Under Attack automaticamente baseado em regras pré-estabelecidas.

### 3.3. Simulação de Assalto (Chaos Engineering)
1. Semanalmente, rodamos nosso suíte de K6 Load Testing e instilamos partições de rede entre o Core e o Redis.
2. **Critério de Aceitação:** A API deve suportar o modo degradado (retornando erros graciosos no Pix sem processar transações fantasma).

## 4. Auditoria de Contato e Acesso
- **CSIRT:** csirt@regenerabank.app
- **Bacen / Compliance:** Acesso read-only aos relatórios extraídos via Datalake.
