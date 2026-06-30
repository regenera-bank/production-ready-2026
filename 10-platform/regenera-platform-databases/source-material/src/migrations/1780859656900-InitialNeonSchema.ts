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

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialNeonSchema1780859656900 implements MigrationInterface {
  name = 'InitialNeonSchema1780859656900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pix_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" uuid NOT NULL, "neural_id" character varying NOT NULL, "type" character varying NOT NULL, "value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_03c06c7e1a6d69ffd5c9fecc669" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4f511e8acffa21ad650837796d" ON "pix_keys" ("type", "value") `,
    );
    await queryRunner.query(
      `CREATE TABLE "idempotency_logs" ("key" character varying NOT NULL, "userId" character varying NOT NULL, "endpoint" character varying NOT NULL, "responseBody" text, "status" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_11f346ac5bf92ea160ca8c136ec" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21282a6aba11e366b8e61d0459" ON "idempotency_logs" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1b89c39fc0db08747cfcc7e6d" ON "idempotency_logs" ("expires_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "metadata" text`);
    await queryRunner.query(
      `ALTER TABLE "pix_keys" ADD CONSTRAINT "FK_a7484949e5a9148f1458fe53de5" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pix_keys" DROP CONSTRAINT "FK_a7484949e5a9148f1458fe53de5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "metadata" jsonb`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1b89c39fc0db08747cfcc7e6d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21282a6aba11e366b8e61d0459"`,
    );
    await queryRunner.query(`DROP TABLE "idempotency_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f511e8acffa21ad650837796d"`,
    );
    await queryRunner.query(`DROP TABLE "pix_keys"`);
  }
}
