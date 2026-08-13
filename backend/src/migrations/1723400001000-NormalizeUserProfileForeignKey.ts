import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserProfileForeignKey1723400001000
  implements MigrationInterface
{
  name = 'NormalizeUserProfileForeignKey1723400001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$
      DECLARE constraint_record RECORD;
      BEGIN
        FOR constraint_record IN
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = 'user_profile'::regclass
            AND contype = 'f'
            AND conname <> 'FK_user_profile_user'
        LOOP
          EXECUTE format(
            'ALTER TABLE "user_profile" DROP CONSTRAINT %I',
            constraint_record.conname
          );
        END LOOP;
      END $$`);
  }

  async down(): Promise<void> {
    // The normalized named foreign key remains valid; no duplicate is restored.
  }
}
