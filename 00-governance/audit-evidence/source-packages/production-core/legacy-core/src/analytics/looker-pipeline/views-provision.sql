-- /*
-- {
--   "name": "@regenera/bank-core",
--   "version": "7.0.0",
--   "description": "Scripts SQL para criação de visões agregadas estruturadas prontas para consumo de BI.",
--   "author": "Paulo Ricardo de Leão (RG-2098233287)"
-- }
-- */

CREATE OR REPLACE VIEW `regenera_analytics.daily_financial_summary` AS
SELECT
  DATE(timestamp) as event_date,
  currency,
  SUM(CASE WHEN operation_type = 'CREDIT' THEN amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN operation_type = 'DEBIT' THEN amount ELSE 0 END) as total_debits,
  COUNT(DISTINCT transaction_id) as transaction_count
FROM
  `regenera_ledger.immutable_entries`
GROUP BY
  event_date, currency;

CREATE OR REPLACE VIEW `regenera_analytics.user_retention_metrics` AS
SELECT
  DATE(created_at) as cohort_date,
  COUNT(DISTINCT user_id) as new_users
FROM
  `regenera_core.users`
GROUP BY
  cohort_date;
