## -- 0004-seed-chart-of-accounts.sql

-- plano de contas institucional mínimo.
-- sem isso o ledger grava linha, mas não sabe explicar onde o dinheiro está.
-- e dinheiro sem endereço contábil é erro esperando reconciliação.
-------------------------------------------------------------------

-- essas contas não são de cliente.
-- são contas do banco.
-- cliente entra depois, com owner_account_id e razão próprio.

BEGIN;

-- seed idempotente.
-- se a conta já existe, não faz nada.
-- migration repetida não pode criar duplicidade nem quebrar deploy.
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
-- reserva em brl.
-- ativo institucional.
-- não recebe depósito de cliente.
-- não serve pra cobrir diferença.
-- se dinheiro de cliente cair aqui, o saldo pode até bater.
-- a contabilidade não.

(
'BANK:CLEARING:PIX',
'ASSET',
'BRL',
true
),
-- clearing pix.
-- dinheiro fica aqui enquanto a liquidação externa não fechou.
-- DEBITED sem SETTLED mora aqui.
-- SENT sem confirmação mora aqui.
-- saldo parado aqui no fechamento precisa ter evento, provider e ledger explicando.
-- se não tiver, é divergência.

(
'BANK:LIABILITY:CUSTOMER_DEPOSITS',
'LIABILITY',
'BRL',
true
),
-- depósitos de clientes.
-- isso é dívida do banco.
-- produto chama de saldo.
-- contabilidade chama de passivo.
-- se o app mostra saldo sem isso aqui sustentar, o app está mentindo.

(
'BANK:REVENUE:FEES',
'REVENUE',
'BRL',
true
),
-- receita de tarifas.
-- cobrou, lança.
-- não cobrou, não inventa.
-- receita sem lançamento é número sem prova.

(
'BANK:EXPENSE:TAXES',
'EXPENSE',
'BRL',
true
)
-- impostos e custos operacionais.
-- despesa não some porque o schema esqueceu dela.
-- só aparece tarde, com nome pior.
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- rollback em produção não.
-- conta contábil usada vira histórico.
-- histórico não se apaga.
--------------------------

-- se errou, desativa a conta.
-- cria outra.
-- deixa rastro.
