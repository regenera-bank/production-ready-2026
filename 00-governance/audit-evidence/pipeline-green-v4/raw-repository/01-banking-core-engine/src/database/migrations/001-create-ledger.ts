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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLedger1700000000001 implements MigrationInterface {
  name = 'CreateLedger1700000000001';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ledger_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'transaction_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15, // Suporta bilhões
            scale: 2, // 2 casas decimais (centavos)
            isNullable: false,
          },
          {
            name: 'operation_type',
            type: 'varchar', // 'CREDIT' ou 'DEBIT'
            isNullable: false,
          },
          {
            name: 'balance_after',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP', // O TypeORM adapta isso automaticamente para o SQLite nos testes!
          },
        ],
      }),
      true,
    );

    // Criação de índice para garantir consultas ultra-rápidas do histórico de uma conta
    await queryRunner.createIndex(
      'ledger_entries',
      new TableIndex({
        name: 'IDX_LEDGER_ACCOUNT',
        columnNames: ['account_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // A função down desfaz exatamente o que a função up fez, na ordem inversa
    await queryRunner.dropIndex('ledger_entries', 'IDX_LEDGER_ACCOUNT');
    await queryRunner.dropTable('ledger_entries');
  }
}
