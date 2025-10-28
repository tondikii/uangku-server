import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1761625504965 implements MigrationInterface {
  name = 'Init1761625504965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" ADD "iconName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ADD "givenDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "loans" ADD "paidDate" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "paidDate"`);
    await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "givenDate"`);
    await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" DROP COLUMN "iconName"`,
    );
  }
}
