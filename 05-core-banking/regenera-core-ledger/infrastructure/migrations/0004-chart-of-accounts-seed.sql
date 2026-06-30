## -- 0004-chart-of-accounts-seed.sql

-- contas mínimas do banco.
-- não são contas de cliente.
-----------------------------

-- sem isso o ledger até grava.
-- mas grava dinheiro sem endereço.
-- dinheiro sem endereço vira reconciliação suja.

BEGIN;

-- seed idempotente.
-- rodar duas vezes não duplica.
-- deploy repetido não pode virar incidente.
INSERT INTO ledger_accounts (
code,
account_class,
currency,
is_active
)
VALUES
(
'BANK:RESERVE:BRL',
'ASSET',
'BRL',
true
),
-- reserva do banco.
-- ativo.
-- não recebe depósito de cliente.
-- não cobre diferença.
-- se caiu dinheiro errado aqui, não "ajusta".
-- investiga.

(
'BANK:CLEARING:PIX',
'ASSET',
'BRL',
true
),
-- trânsito do pix.
-- DEBITED sem SETTLED passa por aqui.
-- SENT sem confirmação também.
-- saldo parado aqui precisa fechar com evento externo.
-- se não fecha, é divergência.

(
'BANK:LIABILITY:CUSTOMER_DEPOSITS',
'LIABILITY',
'BRL',
true
),
-- depósito de cliente.
-- isso é dívida do banco.
-- produto chama de saldo.
-- contabilidade chama de passivo.
-- se a tela mostra saldo e isso aqui não sustenta,
-- a tela está mentindo.

(
'BANK:REVENUE:FEES',
'REVENUE',
'BRL',
true
),
-- tarifa.
-- cobrou, lança.
-- não cobrou, não inventa.
-- receita sem ledger é número sem prova.

(
'BANK:EXPENSE:TAXES',
'EXPENSE',
'BRL',
true
)
-- imposto e custo.
-- despesa não some porque ficou fora do schema.
-- só volta depois, pior.
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- rollback em produção não.
-- conta usada vira história.
-- se errou, desativa.
-- cria outra.
-- deixa rastro.
