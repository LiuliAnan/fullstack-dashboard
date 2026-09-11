/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
  INestApplication,
  ValidationPipe,
  BadGatewayException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { emptyCheckpoint } from '@langchain/langgraph-checkpoint';
import { AppModule } from '../src/app.module';
import { AiCacheService } from '../src/ai-agent/cache/ai-cache.service';
import { AiCheckpointerService } from '../src/ai-agent/cache/ai-checkpointer.service';
import { MockModelAdapter } from '../src/ai-agent/adapters/mock.adapter';
import { aiContext } from '../src/ai-agent/security/ai-context';
import { Company } from '../src/company/company.entity';
import { CreateAiChatTables2026090100000 } from '../src/migrations/2026090100000-CreateAiChatTables';
import { AiFoundation2026090900000 } from '../src/migrations/2026090900000-AiFoundation';

describe('AI foundation acceptance', () => {
  let app: INestApplication;
  let db: DataSource;
  let cache: AiCacheService;
  const users: Array<{ id: number; token: string; email: string }> = [];
  const runId = randomUUID();
  const previous = {
    tenants: process.env.AI_TENANT_USERS,
    admins: process.env.AI_ADMIN_USER_IDS,
    sessionTtl: process.env.AI_SESSION_TTL_SECONDS,
    taskTtl: process.env.AI_TASK_TTL_SECONDS,
  };
  const root = '/api/ai-agent';
  const ids: Record<string, string> = {};
  const call = (
    method: 'get' | 'post' | 'patch' | 'put' | 'delete',
    path: string,
    actor = 0,
  ) =>
    request(app.getHttpServer())
      [method](root + path)
      .set('Authorization', `Bearer ${users[actor].token}`);
  const session = async (actor = 0) =>
    (
      await call('post', '/sessions', actor)
        .send({ provider: 'mock' })
        .expect(201)
    ).body.id as string;
  const send = (id: string, message: string, actor = 0) =>
    call('post', '/chat', actor).send({ sessionId: id, message });

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = fixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    db = app.get(DataSource);
    cache = app.get(AiCacheService);
    for (let index = 0; index < 4; index++) {
      const email = `ai-${runId}-${index}@example.com`;
      const password = 'AiTest12345';
      const signup = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email, password, confirmPassword: password })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      users.push({
        id: signup.body.data.id,
        email,
        token: login.body.data.accessToken,
      });
    }
    process.env.AI_TENANT_USERS = JSON.stringify(
      Object.fromEntries(
        users.map((user, index) => [
          user.id,
          index === 3 ? `b_${runId}` : `a_${runId}`,
        ]),
      ),
    );
    process.env.AI_ADMIN_USER_IDS = `${users[2].id},${users[3].id}`;
    for (let attempt = 0; attempt < 50 && !cache.ready; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    expect(cache.ready).toBe(true);
  }, 60000);
  afterAll(async () => {
    jest.restoreAllMocks();
    if (db?.isInitialized && users.length) {
      await db.query(
        'DELETE FROM ai_operation_audit WHERE tenant_id IN ($1,$2)',
        [`a_${runId}`, `b_${runId}`],
      );
      await db.query('DELETE FROM "user" WHERE id = ANY($1::int[])', [
        users.map((user) => user.id),
      ]);
    }
    for (const [key, value] of Object.entries({
      AI_TENANT_USERS: previous.tenants,
      AI_ADMIN_USER_IDS: previous.admins,
      AI_SESSION_TTL_SECONDS: previous.sessionTtl,
      AI_TASK_TTL_SECONDS: previous.taskTtl,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await app?.close();
  });

  it('migrates old history losslessly and leaves business columns unchanged; rollback works', async () => {
    const q = db.createQueryRunner();
    await q.connect();
    await q.startTransaction();
    try {
      const schema = 'ai_test_' + runId.replaceAll('-', '');
      await q.query(`CREATE SCHEMA "${schema}"`);
      await q.query(`SET LOCAL search_path TO "${schema}", public`);
      await q.query('CREATE TABLE "user" (id integer PRIMARY KEY, email text)');
      await q.query('INSERT INTO "user" VALUES (1, $1)', [
        'migration@example.com',
      ]);
      await new CreateAiChatTables2026090100000().up(q);
      const id = randomUUID();
      await q.query(
        'INSERT INTO ai_chat_sessions (id,user_id,title) VALUES ($1,1,$2)',
        [id, 'Retained'],
      );
      await q.query(
        "INSERT INTO ai_chat_messages (session_id,role,content) VALUES ($1,'user',$2)",
        [id, { text: 'keep history' }],
      );
      const columns = () =>
        q.query(
          'SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position',
          [schema, 'user'],
        );
      const before = await columns();
      const migration = new AiFoundation2026090900000();
      await migration.up(q);
      expect(await columns()).toEqual(before);
      expect(
        (
          await q.query('SELECT title FROM ai_chat_session WHERE id=$1', [id])
        )[0].title,
      ).toBe('Retained');
      expect(
        (
          await q.query(
            'SELECT content FROM ai_chat_messages WHERE session_id=$1',
            [id],
          )
        )[0].content.text,
      ).toBe('keep history');
      await migration.down(q);
      expect((await q.query('SELECT id FROM ai_chat_sessions'))[0].id).toBe(id);
    } finally {
      await q.rollbackTransaction();
      await q.release();
    }
  });
  it.each([
    'sessions',
    'memories',
    'tasks',
    'audits',
    'tasks/00000000-0000-4000-8000-000000000000/state',
  ])('requires JWT for %s', async (path) => {
    await request(app.getHttpServer()).get(`${root}/${path}`).expect(401);
  });
  it.each(['sessions', 'memories', 'tasks', 'audits'])(
    'validates pagination and UUID for %s',
    async (path) => {
      await call('get', `/${path}?page=0`).expect(400);
      await call('get', `/${path}?pageSize=101`).expect(400);
      await call('get', `/${path}/invalid`).expect(400);
    },
  );
  it('rejects owner spoofing, null fields, blank and malformed data', async () => {
    await call('post', '/sessions').send({ tenantId: 'other' }).expect(400);
    await call('post', '/memories')
      .send({ kind: 'x', key: 'x', value: {}, userId: users[1].id })
      .expect(400);
    await call('post', '/memories')
      .send({ kind: ' ', key: 'x', value: {} })
      .expect(400);
    await call('post', '/memories')
      .send({ kind: 'x', key: 'x', value: [] })
      .expect(400);
    await call('post', '/tasks').send({ type: null }).expect(400);
    await call('post', '/tasks').send({}).expect(400);
  });
  it('creates sessions, memories and tasks with trusted ownership and scoped foreign keys', async () => {
    ids.session = await session();
    ids.foreign = await session(3);
    ids.memory = (
      await call('post', '/memories')
        .send({
          kind: 'preference',
          key: 'language',
          value: { language: 'zh' },
          sessionId: ids.session,
        })
        .expect(201)
    ).body.id;
    ids.task = (
      await call('post', '/tasks')
        .send({ type: 'analysis', sessionId: ids.session, input: {} })
        .expect(201)
    ).body.id;
    await call('post', '/memories')
      .send({ kind: 'x', key: 'foreign', value: {}, sessionId: ids.foreign })
      .expect(404);
    await call('post', '/tasks')
      .send({ type: 'analysis', sessionId: ids.foreign })
      .expect(404);
    await expect(
      db.query(
        'INSERT INTO ai_user_memory (tenant_id,user_id,kind,key,value,session_id) VALUES ($1,$2,$3,$4,$5,$6)',
        [`a_${runId}`, users[0].id, 'test', 'fk', {}, ids.foreign],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await call('post', '/memories')
      .send({ kind: 'preference', key: 'language', value: {} })
      .expect(409);
  });
  it.each([
    ['sessions', 'session'],
    ['memories', 'memory'],
    ['tasks', 'task'],
  ])(
    'isolates %s for same-tenant peers and cross-tenant admins',
    async (path, key) => {
      for (const actor of [1, 2, 3]) {
        await call('get', `/${path}/${ids[key]}`, actor).expect(404);
        await call('patch', `/${path}/${ids[key]}`, actor).send({}).expect(404);
        await call('delete', `/${path}/${ids[key]}`, actor).expect(404);
      }
      const list = await call(
        'get',
        `/${path}?userId=${users[0].id}`,
        1,
      ).expect(200);
      expect(list.body.total).toBe(0);
      const own = await call('get', `/${path}?pageSize=1`).expect(200);
      expect(own.body.items).toHaveLength(1);
      expect(own.body.items[0]).toMatchObject({
        tenantId: `a_${runId}`,
        userId: users[0].id,
      });
    },
  );
  it('updates memory, excludes expired memory from lists and deletes it', async () => {
    await call('patch', `/memories/${ids.memory}`)
      .send({ value: { language: 'en' } })
      .expect(200)
      .expect(({ body }) => expect(body.version).toBe(2));
    const expired = await call('post', '/memories')
      .send({
        kind: 'test',
        key: 'expired',
        value: {},
        expiresAt: '2000-01-01T00:00:00Z',
      })
      .expect(201);
    const list = await call('get', '/memories').expect(200);
    expect(
      list.body.items.some(
        (item: { id: string }) => item.id === expired.body.id,
      ),
    ).toBe(false);
    await call('delete', `/memories/${expired.body.id}`).expect(200);
    await call('get', `/memories/${expired.body.id}`).expect(404);
  });
  it('validates task progress, transitions and terminal state', async () => {
    await call('patch', `/tasks/${ids.task}`)
      .send({ progress: 101 })
      .expect(400);
    await call('patch', `/tasks/${ids.task}`)
      .send({ status: 'completed' })
      .expect(400);
    await call('patch', `/tasks/${ids.task}`)
      .send({ status: 'running', progress: 30 })
      .expect(200);
    await call('patch', `/tasks/${ids.task}`)
      .send({ status: 'completed', result: { ok: true } })
      .expect(200)
      .expect(({ body }) => expect(body.progress).toBe(100));
    await call('patch', `/tasks/${ids.task}`)
      .send({ status: 'running' })
      .expect(400);
  });
  it('writes task state, expires it automatically and blocks foreign access', async () => {
    await call('put', `/tasks/${ids.task}/state`)
      .send({ state: { step: 1 }, ttlSeconds: 1 })
      .expect(200);
    await call('get', `/tasks/${ids.task}/state`)
      .expect(200)
      .expect(({ body }) => expect(body.state.step).toBe(1));
    await call('get', `/tasks/${ids.task}/state`, 3).expect(404);
    await call('put', `/tasks/${ids.task}/state`, 1)
      .send({ state: {} })
      .expect(404);
    await call('put', `/tasks/${ids.task}/state`)
      .send({ state: {}, ttlSeconds: 0 })
      .expect(400);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await call('get', `/tasks/${ids.task}/state`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ state: null, expired: true }),
      );
  });
  it('only tenant admins can correct/delete audit events and the original evidence remains', async () => {
    const own = await call('get', '/audits').expect(200);
    ids.audit = own.body.items[0].id;
    await call('get', `/audits/${ids.audit}`, 1).expect(404);
    await call('get', `/audits/${ids.audit}`, 2).expect(200);
    await call('get', `/audits/${ids.audit}`, 3).expect(404);
    await call('post', '/audits')
      .send({ action: 'forge', resource: 'test', outcome: 'success' })
      .expect(403);
    await call('patch', `/audits/${ids.audit}`)
      .send({ reason: 'change' })
      .expect(403);
    await call('patch', `/audits/${ids.audit}`, 3)
      .send({ reason: 'change' })
      .expect(404);
    const manual = await call('post', '/audits', 2)
      .send({
        action: 'note',
        resource: 'test',
        outcome: 'success',
        details: { apiKey: 'secret', nested: { password: 'hidden' } },
      })
      .expect(201);
    expect(manual.body.details).toMatchObject({
      apiKey: '[redacted]',
      nested: { password: '[redacted]' },
    });
    await call('patch', `/audits/${ids.audit}`, 2)
      .send({ reason: 'correction' })
      .expect(200)
      .expect(({ body }) => expect(body.action).toBe(own.body.items[0].action));
    await call('delete', `/audits/${ids.audit}`, 2)
      .send({ reason: 'retained evidence' })
      .expect(200);
    await call('get', `/audits/${ids.audit}`, 2)
      .expect(200)
      .expect(({ body }) => expect(body.deletedAt).toBeTruthy());
    const foreign = await call(
      'get',
      `/audits?userId=${users[0].id}`,
      3,
    ).expect(200);
    expect(foreign.body.total).toBe(0);
  });
  it('keeps 10 complete rounds, persists full history and restores after cache loss', async () => {
    const id = await session();
    for (let round = 1; round <= 11; round++)
      await send(id, `round-${round}`).expect(200);
    const key = cache.key('session', aiContext(users[0].id), id);
    const cached = await cache.read<{ messages: Array<{ content: string }> }>(
      key,
    );
    expect(cached?.messages).toHaveLength(20);
    expect(cached?.messages[0].content).toBe('round-2');
    await call('get', `/sessions/${id}`)
      .expect(200)
      .expect(({ body }) => expect(body.messages).toHaveLength(22));
    await cache.remove(key);
    await send(id, 'after cache loss')
      .expect(200)
      .expect(({ body }) =>
        expect(body.assistantMessage.content.text).toContain('11 轮'),
      );
    expect(
      (await cache.read<{ messages: unknown[] }>(key))?.messages,
    ).toHaveLength(20);
    await call('patch', `/sessions/${id}`)
      .send({ status: 'closed' })
      .expect(200);
    expect(await cache.read(key)).toBeUndefined();
    await send(id, 'closed').expect(400);
    await call('delete', `/sessions/${id}`).expect(200);
  });
  it('automatically expires session context and restores from PostgreSQL', async () => {
    process.env.AI_SESSION_TTL_SECONDS = '1';
    try {
      const id = await session();
      await send(id, 'expiry').expect(200);
      const key = cache.key('session', aiContext(users[0].id), id);
      expect(await cache.read(key)).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await cache.read(key)).toBeUndefined();
      await send(id, 'recover')
        .expect(200)
        .expect(({ body }) =>
          expect(body.assistantMessage.content.text).toContain('2 轮'),
        );
    } finally {
      delete process.env.AI_SESSION_TTL_SECONDS;
    }
  });
  it('caches only matching user/context/model and supports business invalidation and toggles', async () => {
    const question = `cache-${runId}`;
    const a = await session();
    const b = await session();
    const c = await session(1);
    await send(a, question)
      .expect(200)
      .expect(({ body }) => expect(body.cacheHit).toBe(false));
    await send(b, question)
      .expect(200)
      .expect(({ body }) => expect(body.cacheHit).toBe(true));
    await send(c, question, 1)
      .expect(200)
      .expect(({ body }) => expect(body.cacheHit).toBe(false));
    await send(a, question)
      .expect(200)
      .expect(({ body }) => expect(body.cacheHit).toBe(false));
    await cache.invalidateBusiness('chat');
    await send(await session(), question)
      .expect(200)
      .expect(({ body }) => expect(body.cacheHit).toBe(false));
    process.env.AI_CACHE_CHAT_ENABLED = 'false';
    try {
      await send(await session(), question)
        .expect(200)
        .expect(({ body }) => expect(body.cacheHit).toBe(false));
    } finally {
      delete process.env.AI_CACHE_CHAT_ENABLED;
    }
  });
  it('calls the existing company service, caches results, and invalidates after a committed business write', async () => {
    const query = { dimension: 'level', filter: {} };
    const business = await request(app.getHttpServer())
      .post('/api/dashboard/barchart')
      .set('Authorization', `Bearer ${users[0].token}`)
      .send(query)
      .expect(200);
    const first = await call('post', '/tools/companies/filter')
      .send(query)
      .expect(200);
    expect(first.body.data).toEqual(business.body);
    await call('post', '/tools/companies/filter')
      .send(query)
      .expect(200)
      .expect(({ body }) => expect(body.cacheHit).toBe(true));
    const code = 'ai-test-' + runId;
    try {
      await db.transaction((manager) =>
        manager.save(
          Company,
          manager.create(Company, {
            company_code: code,
            company_name: 'AI isolated fixture',
            level: 1,
            country: 'Test',
            city: 'Test',
            founded_year: 2020,
            annual_revenue: 100,
            employees: 1,
          }),
        ),
      );
      const changed = await call('post', '/tools/companies/filter')
        .send(query)
        .expect(200);
      expect(changed.body.cacheHit).toBe(false);
      expect(changed.body.data).not.toEqual(first.body.data);
    } finally {
      await db.getRepository(Company).delete({ company_code: code });
    }
    await call('post', '/chat')
      .send({
        sessionId: await session(),
        message: 'Summarize the company data',
        companyQuery: query,
      })
      .expect(200)
      .expect(({ body }) => expect(body.toolResult.data).toBeDefined());
  });
  it('serializes simultaneous messages without losing either round', async () => {
    const id = await session();
    const responses = await Promise.all([
      send(id, 'first'),
      send(id, 'second'),
    ]);
    responses.forEach((response) => expect(response.status).toBe(200));
    await call('get', `/sessions/${id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(
          body.messages.map((item: { role: string }) => item.role),
        ).toEqual(['user', 'assistant', 'user', 'assistant']);
      });
  });
  it('rolls back a failed model round and still works during a Redis outage', async () => {
    const id = await session();
    const adapter = app.get(MockModelAdapter);
    const failure = jest
      .spyOn(adapter, 'chat')
      .mockRejectedValueOnce(new BadGatewayException('test provider failure'));
    await send(id, 'failure').expect(502);
    failure.mockRestore();
    await call('get', `/sessions/${id}`)
      .expect(200)
      .expect(({ body }) => expect(body.messages).toHaveLength(0));
    const offline = jest.spyOn(cache, 'ready', 'get').mockReturnValue(false);
    try {
      await send(id, 'offline cache').expect(200);
      await call('get', `/tasks/${ids.task}/state`).expect(503);
      await call('put', `/tasks/${ids.task}/state`)
        .send({ state: {} })
        .expect(503);
    } finally {
      offline.mockRestore();
    }
    await send(id, 'online again')
      .expect(200)
      .expect(({ body }) =>
        expect(body.assistantMessage.content.text).toContain('2 轮'),
      );
  });
  it('persists official checkpointer tuples, parent lineage, pending writes, namespaces, TTL and scope', async () => {
    const ctx = aiContext(users[0].id);
    const factory = app.get(AiCheckpointerService);
    const saver = factory.forTask(ctx, ids.task);
    const config = { configurable: { thread_id: ids.task, checkpoint_ns: '' } };
    const cp1 = {
      ...emptyCheckpoint(),
      id: '0001',
      channel_values: { count: 1 },
    };
    const saved1 = await saver.put(config, cp1, {
      source: 'input',
      step: 0,
      parents: {},
    });
    await saver.putWrites(saved1, [['result', { ok: true }]], 'writer');
    const cp2 = {
      ...emptyCheckpoint(),
      id: '0002',
      channel_values: { count: 2 },
    };
    await saver.put(saved1, cp2, { source: 'loop', step: 1, parents: {} });
    const restored = factory.forTask(ctx, ids.task);
    const latest = await restored.getTuple(config);
    expect(latest?.checkpoint.channel_values.count).toBe(2);
    expect(latest?.parentConfig?.configurable?.checkpoint_id).toBe('0001');
    expect((await restored.getTuple(saved1))?.pendingWrites).toEqual([
      ['writer', 'result', { ok: true }],
    ]);
    const tuples = [];
    for await (const tuple of restored.list(config, { limit: 1 }))
      tuples.push(tuple);
    expect(tuples).toHaveLength(1);
    expect(
      await restored.getTuple({
        configurable: { thread_id: ids.task, checkpoint_ns: 'other' },
      }),
    ).toBeUndefined();
    await expect(
      restored.getTuple({ configurable: { thread_id: ids.foreign } }),
    ).rejects.toThrow();
    await expect(
      factory.forTask(aiContext(users[3].id), ids.task).getTuple(config),
    ).rejects.toThrow();
    await restored.deleteThread(ids.task);
    expect(await restored.getTuple(config)).toBeUndefined();
    process.env.AI_TASK_TTL_SECONDS = '1';
    try {
      await restored.put(config, cp1, {
        source: 'input',
        step: 0,
        parents: {},
      });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await restored.getTuple(config)).toBeUndefined();
    } finally {
      delete process.env.AI_TASK_TTL_SECONDS;
    }
  });
  it('rejects configured non-members and ignores client-supplied tenant headers', async () => {
    const mappings = process.env.AI_TENANT_USERS!;
    const map = JSON.parse(mappings);
    delete map[users[1].id];
    process.env.AI_TENANT_USERS = JSON.stringify(map);
    try {
      await call('get', '/sessions', 1).expect(403);
    } finally {
      process.env.AI_TENANT_USERS = mappings;
    }
    await call('get', `/sessions/${ids.session}`, 3)
      .set('X-Tenant-Id', `a_${runId}`)
      .expect(404);
  });
  it('expires cached chat results using the configured TTL', async () => {
    const old = process.env.AI_CHAT_TTL_SECONDS;
    process.env.AI_CHAT_TTL_SECONDS = '1';
    try {
      const question = `ttl-${runId}`;
      await send(await session(), question)
        .expect(200)
        .expect(({ body }) => expect(body.cacheHit).toBe(false));
      await send(await session(), question)
        .expect(200)
        .expect(({ body }) => expect(body.cacheHit).toBe(true));
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await send(await session(), question)
        .expect(200)
        .expect(({ body }) => expect(body.cacheHit).toBe(false));
    } finally {
      if (old === undefined) delete process.env.AI_CHAT_TTL_SECONDS;
      else process.env.AI_CHAT_TTL_SECONDS = old;
    }
  });

  it('serializes closing against an in-flight send and leaves no session cache', async () => {
    const id = await session();
    const adapter = app.get(MockModelAdapter);
    const original: MockModelAdapter['chat'] = adapter.chat.bind(adapter);
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const spy = jest
      .spyOn(adapter, 'chat')
      .mockImplementationOnce(async (input) => {
        entered();
        await gate;
        return original(input);
      });
    try {
      const pending = send(id, `close-race-${runId}`).then(
        (response) => response,
      );
      await started;
      const closing = call('patch', `/sessions/${id}`)
        .send({ status: 'closed' })
        .then((response) => response);
      release();
      expect((await pending).status).toBe(200);
      expect((await closing).status).toBe(200);
      expect(
        await cache.read(cache.key('session', aiContext(users[0].id), id)),
      ).toBeUndefined();
      await send(id, 'closed').expect(400);
    } finally {
      release();
      spy.mockRestore();
    }
  });

  it('retains memory and task records with null session links when a session is deleted', async () => {
    const id = await session();
    const memory = await call('post', '/memories')
      .send({ kind: 'test', key: randomUUID(), value: {}, sessionId: id })
      .expect(201);
    const task = await call('post', '/tasks')
      .send({ type: 'test', sessionId: id })
      .expect(201);
    await call('delete', `/sessions/${id}`).expect(200);
    await call('get', `/memories/${memory.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.sessionId).toBeNull());
    await call('get', `/tasks/${task.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.sessionId).toBeNull());
  });

  it('deletes a task and clears its temporary state', async () => {
    await call('put', `/tasks/${ids.task}/state`)
      .send({ state: { step: 9 } })
      .expect(200);
    await call('delete', `/tasks/${ids.task}`).expect(200);
    await call('get', `/tasks/${ids.task}`).expect(404);
    expect(
      await cache.read(
        cache.key('task', aiContext(users[0].id), `${ids.task}:state`),
      ),
    ).toBeUndefined();
  });
});
