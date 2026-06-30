// Unit/integration specs (non-Postgres) must opt into in-memory explicitly.
process.env.CORE_BANK_STORAGE = process.env.CORE_BANK_STORAGE ?? 'memory';