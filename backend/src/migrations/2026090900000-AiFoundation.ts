import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiFoundation2026090900000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    const tenant = process.env.AI_DEFAULT_TENANT || 'default';
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tenant))
      throw new Error('Invalid AI_DEFAULT_TENANT');
    await q.query('ALTER TABLE ai_chat_sessions RENAME TO ai_chat_session');
    await q.query(
      'ALTER TABLE ai_chat_session ADD tenant_id varchar(64), ADD version integer NOT NULL DEFAULT 1',
    );
    await q.query('UPDATE ai_chat_session SET tenant_id = $1', [tenant]);
    const mappings = JSON.parse(process.env.AI_TENANT_USERS || '{}') as Record<
      string,
      string
    >;
    for (const [userId, tenantId] of Object.entries(mappings)) {
      if (!/^\d+$/.test(userId) || !/^[a-zA-Z0-9_-]{1,64}$/.test(tenantId))
        throw new Error('Invalid AI_TENANT_USERS');
      await q.query(
        'UPDATE ai_chat_session SET tenant_id = $1 WHERE user_id = $2',
        [tenantId, Number(userId)],
      );
    }
    await q.query(`ALTER TABLE ai_chat_session ALTER COLUMN tenant_id SET NOT NULL,
      ADD CONSTRAINT "CHK_ai_session_status" CHECK (status IN ('active','closed')),
      ADD CONSTRAINT "UQ_ai_session_scope" UNIQUE (id, tenant_id, user_id)`);
    await q.query(
      'CREATE INDEX "IDX_ai_session_owner" ON ai_chat_session (tenant_id, user_id, updated_at)',
    );
    const owned = `id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id varchar(64) NOT NULL,
      user_id integer NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()`;
    await q.query(`CREATE TABLE ai_user_memory (${owned}, kind varchar(40) NOT NULL, key varchar(120) NOT NULL,
      value jsonb NOT NULL, session_id uuid, version integer NOT NULL DEFAULT 1, expires_at timestamp,
      CONSTRAINT "UQ_ai_memory_key" UNIQUE (tenant_id,user_id,kind,key),
      CONSTRAINT "FK_ai_memory_session" FOREIGN KEY (session_id,tenant_id,user_id)
        REFERENCES ai_chat_session(id,tenant_id,user_id) ON DELETE SET NULL (session_id))`);
    await q.query(
      'CREATE INDEX "IDX_ai_memory_owner" ON ai_user_memory (tenant_id,user_id,updated_at)',
    );
    await q.query(`CREATE TABLE ai_task_record (${owned}, session_id uuid, type varchar(80) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending', progress integer NOT NULL DEFAULT 0,
      input jsonb NOT NULL DEFAULT '{}', result jsonb, error_summary varchar(1000), version integer NOT NULL DEFAULT 1,
      started_at timestamp, finished_at timestamp,
      CONSTRAINT "CHK_ai_task_status" CHECK (status IN ('pending','running','completed','failed','cancelled')),
      CONSTRAINT "CHK_ai_task_progress" CHECK (progress BETWEEN 0 AND 100),
      CONSTRAINT "FK_ai_task_session" FOREIGN KEY (session_id,tenant_id,user_id)
        REFERENCES ai_chat_session(id,tenant_id,user_id) ON DELETE SET NULL (session_id))`);
    await q.query(
      'CREATE INDEX "IDX_ai_task_owner" ON ai_task_record (tenant_id,user_id,status,created_at)',
    );
    await q.query(`CREATE TABLE ai_operation_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id varchar(64) NOT NULL, user_id integer REFERENCES "user"(id) ON DELETE SET NULL,
      actor_id integer REFERENCES "user"(id) ON DELETE SET NULL, action varchar(80) NOT NULL,
      resource varchar(80) NOT NULL, resource_id uuid, outcome varchar(20) NOT NULL,
      request_id uuid NOT NULL, details jsonb NOT NULL DEFAULT '{}', correction varchar(1000), deleted_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "CHK_ai_audit_outcome" CHECK (outcome IN ('success','failure')))`);
    await q.query(
      'CREATE INDEX "IDX_ai_audit_owner" ON ai_operation_audit (tenant_id,user_id,created_at)',
    );
    await q.query(
      'CREATE INDEX "IDX_ai_audit_resource" ON ai_operation_audit (tenant_id,resource,resource_id)',
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE ai_operation_audit');
    await q.query('DROP TABLE ai_task_record');
    await q.query('DROP TABLE ai_user_memory');
    await q.query('DROP INDEX "IDX_ai_session_owner"');
    await q.query(
      'ALTER TABLE ai_chat_session DROP CONSTRAINT "UQ_ai_session_scope", DROP CONSTRAINT "CHK_ai_session_status", DROP COLUMN tenant_id, DROP COLUMN version',
    );
    await q.query('ALTER TABLE ai_chat_session RENAME TO ai_chat_sessions');
  }
}
