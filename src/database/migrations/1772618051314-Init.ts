import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGmailColumns1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Kolom baru di tabel users
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "googleRefreshToken" text,
        ADD COLUMN IF NOT EXISTS "gmailLastSyncAt" timestamp
    `);

    // Kolom baru di tabel transactions
    await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD COLUMN IF NOT EXISTS "externalRef" varchar(100),
        ADD COLUMN IF NOT EXISTS "importSource" varchar(20) DEFAULT 'manual'
    `);

    // Index untuk mempercepat pengecekan duplikat
    // Kita sering query: WHERE "externalRef" = 'gmail_xxx' AND userId = N
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_externalRef"
        ON "transactions" ("externalRef")
        WHERE "externalRef" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_externalRef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "externalRef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "importSource"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "googleRefreshToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "gmailLastSyncAt"`,
    );
  }
}
