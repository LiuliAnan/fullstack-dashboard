import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenDatabaseSchema1723400000000 implements MigrationInterface {
  name = 'HardenDatabaseSchema1723400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vector');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR NOT NULL UNIQUE,
        "password_hash" VARCHAR NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profile" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE,
        "name" VARCHAR NOT NULL,
        "role" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company" (
        "company_code" VARCHAR PRIMARY KEY,
        "company_name" VARCHAR NOT NULL,
        "level" INTEGER NOT NULL,
        "country" VARCHAR NOT NULL,
        "city" VARCHAR NOT NULL,
        "founded_year" INTEGER NOT NULL,
        "annual_revenue" INTEGER NOT NULL,
        "employees" INTEGER NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "relationship" (
        "company_code" VARCHAR PRIMARY KEY,
        "parent_company" VARCHAR NULL
      )
    `);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_profile_user') THEN
        ALTER TABLE "user_profile" ADD CONSTRAINT "FK_user_profile_user"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
      END IF;
    END $$`);
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_relationship_company') THEN
        ALTER TABLE "relationship" ADD CONSTRAINT "FK_relationship_company"
          FOREIGN KEY ("company_code") REFERENCES "company"("company_code") ON DELETE CASCADE;
      END IF;
    END $$`);
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_relationship_parent') THEN
        ALTER TABLE "relationship" ADD CONSTRAINT "FK_relationship_parent"
          FOREIGN KEY ("parent_company") REFERENCES "company"("company_code") ON DELETE SET NULL;
      END IF;
    END $$`);

    await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT IF EXISTS "CHK_user_profile_role"`);
    await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "CHK_user_profile_role" CHECK ("role" IN ('Admin','Manager','Editor','User'))`);
    await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT IF EXISTS "CHK_user_profile_status"`);
    await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "CHK_user_profile_status" CHECK ("status" IN ('active','banned','pending'))`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_level"`);
    await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "CHK_company_level" CHECK ("level" BETWEEN 1 AND 4)`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_founded_year"`);
    await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "CHK_company_founded_year" CHECK ("founded_year" BETWEEN 1800 AND 2100)`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_annual_revenue"`);
    await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "CHK_company_annual_revenue" CHECK ("annual_revenue" >= 0)`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_employees"`);
    await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "CHK_company_employees" CHECK ("employees" >= 0)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_employees"`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_annual_revenue"`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_founded_year"`);
    await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "CHK_company_level"`);
    await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT IF EXISTS "CHK_user_profile_status"`);
    await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT IF EXISTS "CHK_user_profile_role"`);
    await queryRunner.query(`ALTER TABLE "relationship" DROP CONSTRAINT IF EXISTS "FK_relationship_parent"`);
    await queryRunner.query(`ALTER TABLE "relationship" DROP CONSTRAINT IF EXISTS "FK_relationship_company"`);
  }
}
