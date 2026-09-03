import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiChatTables2026090100000 implements MigrationInterface {
  name = 'CreateAiChatTables2026090100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_chat_sessions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" integer NOT NULL,
      "title" varchar(120) NOT NULL DEFAULT 'New conversation', "model_provider" varchar(30) NOT NULL DEFAULT 'mock',
      "model_name" varchar(80), "status" varchar(20) NOT NULL DEFAULT 'active',
      "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ai_chat_sessions" PRIMARY KEY ("id"),
      CONSTRAINT "FK_ai_chat_sessions_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_chat_sessions_user" ON "ai_chat_sessions" ("user_id", "updated_at")`,
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "session_id" uuid NOT NULL,
      "role" varchar(20) NOT NULL, "message_type" varchar(30) NOT NULL DEFAULT 'text',
      "content" jsonb NOT NULL, "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ai_chat_messages" PRIMARY KEY ("id"),
      CONSTRAINT "FK_ai_chat_messages_session" FOREIGN KEY ("session_id") REFERENCES "ai_chat_sessions"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_chat_messages_session" ON "ai_chat_messages" ("session_id", "created_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ai_chat_messages"');
    await queryRunner.query('DROP TABLE IF EXISTS "ai_chat_sessions"');
  }
}
