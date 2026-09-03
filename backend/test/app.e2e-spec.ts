/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Application E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken = '';
  let userId = 0;

  const email = 'e2e-week1-dashboard@example.com';
  const password = 'E2ePass123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    dataSource = app.get(DataSource);

    await dataSource.query('DELETE FROM "user" WHERE "email" = $1', [email]);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query('DELETE FROM "user" WHERE "email" = $1', [email]);
    }
    await app?.close();
  });

  it('rejects protected APIs without a JWT', async () => {
    await request(app.getHttpServer()).get('/api/users').expect(401);
    await request(app.getHttpServer()).get('/api/companies').expect(401);
    await request(app.getHttpServer()).get('/api/dashboard').expect(401);
    await request(app.getHttpServer())
      .get('/api/ai-agent/sessions')
      .expect(401);
  });

  it('registers a normalized user and creates the profile transactionally', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: `  ${email.toUpperCase()}  `,
        password,
        confirmPassword: password,
      })
      .expect(201);

    userId = response.body.data.id;
    expect(response.body.data.email).toBe(email);

    const rows = await dataSource.query(
      `SELECT u.email, p.name, p.role, p.status
       FROM "user" u
       INNER JOIN user_profile p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    expect(rows).toEqual([
      {
        email,
        name: 'e2e-week1-dashboard',
        role: 'User',
        status: 'active',
      },
    ]);
  });

  it('rejects a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email, password, confirmPassword: password })
      .expect(409);
  });

  it('logs in and returns a usable JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = response.body.data.accessToken;
    expect(accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toMatchObject({ id: userId, email });
      });
  });

  it('supports user pagination, search, and validation', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .query({ page: 1, pageSize: 5, role: 'User', search: 'e2e-week1' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({ page: 1, pageSize: 5, total: 1 });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].id).toBe(userId);

    await request(app.getHttpServer())
      .get('/api/users')
      .query({ pageSize: 101 })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('supports company pagination and combined filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/companies')
      .query({ page: 1, pageSize: 5, level: '1,2', search: 'a' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(5);
    expect(response.body.items.length).toBeLessThanOrEqual(5);
    expect(response.body.total).toBeGreaterThan(0);
    for (const company of response.body.items) {
      expect([1, 2]).toContain(company.level);
      expect(company.company_name.toLowerCase()).toContain('a');
      expect(company.profit_efficiency).toEqual(expect.any(Number));
    }
  });

  it('returns the expected dashboard aggregates', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.stats).toEqual({
      companyCount: 2000,
      totalRevenue: 182779175,
      countryCount: 8,
      employeeCount: 699119,
    });
    expect(
      response.body.levelDistribution.reduce(
        (sum: number, item: { percentage: number }) => sum + item.percentage,
        0,
      ),
    ).toBeCloseTo(100);
    expect(response.body.foundedTrend.at(-1)).toEqual({
      year: 2023,
      cumulative: 2000,
    });
  });

  it('returns bar-chart options and applies combined company filters', async () => {
    const options = await request(app.getHttpServer())
      .get('/api/dashboard/barchart/options')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(options.body.levels).toEqual([1, 2, 3, 4]);
    expect(options.body.countries).toContain('China');
    expect(options.body.ranges.foundedYear.min).toBeLessThanOrEqual(
      options.body.ranges.foundedYear.max,
    );

    const response = await request(app.getHttpServer())
      .post('/api/dashboard/barchart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        dimension: 'level',
        filter: {
          level: [1, 2, 3],
          country: ['China', 'United States'],
          city: [],
          founded_year: { start: 1950, end: 2023 },
          annual_revenue: { min: 0, max: 1000000 },
          employees: { min: 0, max: 5000 },
        },
      })
      .expect(200);

    expect(response.body.dimension).toBe('level');
    expect(response.body.total).toBeGreaterThan(0);
    expect(
      response.body.data.every((item: { label: string }) =>
        ['1', '2', '3'].includes(item.label),
      ),
    ).toBe(true);
    expect(
      response.body.data.reduce(
        (sum: number, item: { percentage: number }) => sum + item.percentage,
        0,
      ),
    ).toBeCloseTo(100);
  });

  it('validates the bar-chart dimension and range order', async () => {
    await request(app.getHttpServer())
      .post('/api/dashboard/barchart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dimension: 'industry', filter: {} })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/dashboard/barchart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        dimension: 'country',
        filter: { employees: { min: 100, max: 10 } },
      })
      .expect(400);
  });

  it('returns a filtered company hierarchy without duplicate nodes', async () => {
    const expected = await dataSource.query(
      `SELECT COUNT(*)::int AS count FROM company
       WHERE level IN (1, 2) AND country = 'China'
         AND founded_year BETWEEN 1900 AND 2023`,
    );
    const response = await request(app.getHttpServer())
      .post('/api/dashboard/bubblechart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        filter: {
          level: [1, 2],
          country: ['China'],
          city: [],
          founded_year: { start: 1900, end: 2023 },
          annual_revenue: {},
          employees: {},
        },
      })
      .expect(200);

    type Node = {
      code: string;
      level: number;
      country?: string;
      matched?: boolean;
      children?: Node[];
    };
    const flatten = (nodes: Node[]): Node[] =>
      nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
    const nodes = flatten(response.body.hierarchy.children);
    const matchedNodes = nodes.filter((node) => node.matched);
    expect(response.body.total).toBe(expected[0].count);
    expect(new Set(nodes.map((node) => node.code)).size).toBe(nodes.length);
    expect(matchedNodes).toHaveLength(expected[0].count);
    expect(
      matchedNodes.every(
        (node) => [1, 2].includes(node.level) && node.country === 'China',
      ),
    ).toBe(true);
    expect(nodes.length).toBeGreaterThanOrEqual(matchedNodes.length);

    const expectedLeafCompanies = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM company WHERE level = 4',
    );
    const leafResponse = await request(app.getHttpServer())
      .post('/api/dashboard/bubblechart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ filter: { level: [4] } })
      .expect(200);
    const leafTreeNodes = flatten(leafResponse.body.hierarchy.children);
    const matchedLeafNodes = leafTreeNodes.filter((node) => node.matched);
    expect(leafResponse.body.total).toBe(expectedLeafCompanies[0].count);
    expect(matchedLeafNodes).toHaveLength(expectedLeafCompanies[0].count);
    expect(leafTreeNodes.length).toBeGreaterThan(matchedLeafNodes.length);
  });

  it('rejects invalid bubble-chart ranges', async () => {
    await request(app.getHttpServer())
      .post('/api/dashboard/bubblechart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ filter: { annual_revenue: { min: 500, max: 100 } } })
      .expect(400);
  });

  it('persists a multi-turn AI conversation and reloads its history', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/ai-agent/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'E2E conversation', provider: 'mock' })
      .expect(201);
    const sessionId = created.body.id as string;

    await request(app.getHttpServer())
      .post('/api/ai-agent/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ sessionId, message: 'First question' })
      .expect(200)
      .expect(({ body }) => expect(body.provider).toBe('mock'));

    await request(app.getHttpServer())
      .post('/api/ai-agent/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ sessionId, message: 'Second question' })
      .expect(200)
      .expect(({ body }) =>
        expect(body.assistantMessage.content.text).toContain('2 轮'),
      );

    await request(app.getHttpServer())
      .get(`/api/ai-agent/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.messages).toHaveLength(4));

    await request(app.getHttpServer())
      .post('/api/ai-agent/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ sessionId, message: '   ' })
      .expect(400);
  });

  it('accepts supported chat attachments', async () => {
    await request(app.getHttpServer())
      .post('/api/ai-agent/files')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('files', Buffer.from('agent upload test'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].name).toBe('note.txt');
        expect(body[0].mimeType).toBe('text/plain');
      });

    await request(app.getHttpServer())
      .post('/api/ai-agent/files')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('files', Buffer.from('not allowed'), {
        filename: 'script.exe',
        contentType: 'application/octet-stream',
      })
      .expect(400);
  });

  it('validates batch deletion and deletes the test user', async () => {
    await request(app.getHttpServer())
      .delete('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ids: [] })
      .expect(400);

    await request(app.getHttpServer())
      .delete('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ids: [userId] })
      .expect(200)
      .expect({ deleted: 1 });

    const rows = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM "user" WHERE "email" = $1',
      [email],
    );
    expect(rows[0].count).toBe(0);
  });
});
