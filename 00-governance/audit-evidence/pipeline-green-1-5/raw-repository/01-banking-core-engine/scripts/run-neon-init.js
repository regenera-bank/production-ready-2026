/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://***REDACTED_DATABASE_URL***';

const sqlPath = path.resolve(__dirname, '../../04-secure-cloud-foundation/sql/V1__init.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

(async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL');
    await client.query(sql);
    console.log('Successfully executed V1__init.sql - Neon DB initialized with users, accounts, transactions, custody tables for real ACID ledger.');
  } catch (err) {
    console.error('Error running init SQL:', err.message);
  } finally {
    await client.end();
  }
})();
