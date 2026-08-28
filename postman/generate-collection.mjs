import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, 'api.postman_collection.json');

const jsonHeaders = [{ key: 'Content-Type', value: 'application/json' }];
const authHeader = { key: 'Authorization', value: 'Bearer {{accessToken}}' };

function scripts(expected, checks = [], maxMs = 1500) {
  return [
    `pm.test("status code is ${expected}", () => pm.response.to.have.status(${expected}));`,
    `pm.test("response time is below ${maxMs} ms", () => pm.expect(pm.response.responseTime).to.be.below(${maxMs}));`,
    'pm.test("content type is JSON", () => pm.expect(pm.response.headers.get("Content-Type") || "").to.include("application/json"));',
    'pm.test("response body is valid JSON", () => pm.expect(() => pm.response.json()).not.to.throw());',
    ...checks.map(([name, code]) => `pm.test(${JSON.stringify(name)}, () => { ${code} });`),
  ];
}

function request(name, method, path, { body, query, auth = true, token, expected = 200, checks = [], testExtra = [], maxMs } = {}) {
  const headers = [...(body !== undefined ? jsonHeaders : [])];
  if (auth) headers.push({ ...authHeader, value: token ?? authHeader.value });
  const raw = `{{baseUrl}}${path}${query ? `?${query}` : ''}`;
  return {
    name,
    request: {
      method,
      header: headers,
      url: { raw, host: ['{{baseUrl}}'], path: path.replace(/^\//, '').split('/'), ...(query ? { query: query.split('&').map((part) => { const [key, value] = part.split('='); return { key, value }; }) } : {}) },
      ...(body !== undefined ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
      description: `Test case for ${method} ${path}`,
    },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: [...scripts(expected, checks, maxMs), ...testExtra] } }],
  };
}

const errorCheck = ['error response contains message', 'const b=pm.response.json(); pm.expect(b).to.have.property("message");'];
const unauthorized = (name, method, path, options = {}) => request(name, method, path, { ...options, token: 'invalid-token', expected: 401, checks: [errorCheck] });

const authEmail = '{{authEmail}}';
const password = 'PostmanPass123';
const validCompany = {
  company_code: '{{companyCode}}', company_name: 'Postman Test Supplier', level: 2,
  country: 'China', city: 'Shanghai', founded_year: 2020,
  annual_revenue: 500000, employees: 100, parent_company: 'C001',
};

const folders = [];
const folder = (name, item) => folders.push({ name, item });

folder('Auth - POST /api/auth/signup', [
  request('01 valid signup', 'POST', '/api/auth/signup', { auth: false, expected: 201, body: { email: authEmail, password, confirmPassword: password }, checks: [['signup response schema', 'const b=pm.response.json(); pm.expect(b.statusCode).to.eql(201); pm.expect(b.data.email).to.eql(pm.collectionVariables.get("authEmail"));']], testExtra: ['const b=pm.response.json(); if (b.data?.id) pm.collectionVariables.set("authUserId", b.data.id);'] }),
  request('02 invalid email format', 'POST', '/api/auth/signup', { auth: false, expected: 400, body: { email: 'invalid-email', password, confirmPassword: password }, checks: [errorCheck] }),
  request('03 empty body', 'POST', '/api/auth/signup', { auth: false, expected: 400, body: {}, checks: [errorCheck] }),
  request('04 password mismatch', 'POST', '/api/auth/signup', { auth: false, expected: 400, body: { email: '{{mismatchEmail}}', password, confirmPassword: 'Different123' }, checks: [errorCheck] }),
  request('05 duplicate email', 'POST', '/api/auth/signup', { auth: false, expected: 409, body: { email: authEmail, password, confirmPassword: password }, checks: [errorCheck] }),
]);

folder('Auth - POST /api/auth/login', [
  request('01 valid login and save JWT', 'POST', '/api/auth/login', { auth: false, body: { email: authEmail, password }, checks: [['login response has JWT', 'const b=pm.response.json(); pm.expect(b.data.accessToken).to.be.a("string").and.not.empty; pm.expect(b.data.user.email).to.eql(pm.collectionVariables.get("authEmail"));']], testExtra: ['const b=pm.response.json(); if (b.data?.accessToken) pm.collectionVariables.set("accessToken", b.data.accessToken);'] }),
  request('02 wrong password', 'POST', '/api/auth/login', { auth: false, expected: 401, body: { email: authEmail, password: 'WrongPass123' }, checks: [errorCheck] }),
  request('03 unknown email', 'POST', '/api/auth/login', { auth: false, expected: 401, body: { email: '{{unknownEmail}}', password }, checks: [errorCheck] }),
  request('04 malformed email', 'POST', '/api/auth/login', { auth: false, expected: 400, body: { email: 'bad', password }, checks: [errorCheck] }),
  request('05 empty body', 'POST', '/api/auth/login', { auth: false, expected: 400, body: {}, checks: [errorCheck] }),
]);

folder('Auth - GET /api/auth/me', [
  request('01 valid JWT', 'GET', '/api/auth/me', { checks: [['returns current user', 'const b=pm.response.json(); pm.expect(b.statusCode).to.eql(200); pm.expect(b.data.email).to.eql(pm.collectionVariables.get("authEmail"));']] }),
  request('02 missing JWT', 'GET', '/api/auth/me', { auth: false, expected: 401, checks: [errorCheck] }),
  unauthorized('03 malformed JWT', 'GET', '/api/auth/me'),
  request('04 JSON contract', 'GET', '/api/auth/me', { checks: [['response keys are stable', 'const b=pm.response.json(); pm.expect(b).to.have.all.keys("statusCode","data"); pm.expect(b.data).to.include.keys("id","email");']] }),
  request('05 performance', 'GET', '/api/auth/me', { maxMs: 750, checks: [['email is normalized', 'pm.expect(pm.response.json().data.email).to.eql(pm.response.json().data.email.toLowerCase());']] }),
]);

folder('Users - POST /api/users', [
  request('01 create managed user', 'POST', '/api/users', { expected: 201, body: { name: 'Postman Managed User', email: '{{managedEmail}}', password, role: 'Editor', status: 'active' }, checks: [['created user contract', 'const b=pm.response.json(); pm.expect(b).to.include.keys("id","email","name","role","status","createdAt"); pm.expect(b.role).to.eql("Editor");']], testExtra: ['const b=pm.response.json(); if (b.id) pm.collectionVariables.set("managedUserId", b.id);'] }),
  request('02 empty body', 'POST', '/api/users', { expected: 400, body: {}, checks: [errorCheck] }),
  request('03 invalid email', 'POST', '/api/users', { expected: 400, body: { name: 'Bad', email: 'bad', password, role: 'User', status: 'active' }, checks: [errorCheck] }),
  request('04 invalid role', 'POST', '/api/users', { expected: 400, body: { name: 'Bad', email: '{{invalidRoleEmail}}', password, role: 'Owner', status: 'active' }, checks: [errorCheck] }),
  request('05 duplicate email', 'POST', '/api/users', { expected: 409, body: { name: 'Duplicate', email: '{{managedEmail}}', password, role: 'User', status: 'active' }, checks: [errorCheck] }),
]);

folder('Users - GET /api/users', [
  request('01 default list', 'GET', '/api/users', { checks: [['pagination contract', 'const b=pm.response.json(); pm.expect(b.items).to.be.an("array"); pm.expect(b).to.include.keys("total","page","pageSize");']] }),
  request('02 pagination', 'GET', '/api/users', { query: 'page=1&pageSize=2', checks: [['page size honored', 'const b=pm.response.json(); pm.expect(b.page).to.eql(1); pm.expect(b.pageSize).to.eql(2); pm.expect(b.items.length).to.be.at.most(2);']] }),
  request('03 role filter', 'GET', '/api/users', { query: 'role=Editor', checks: [['role filter honored', 'pm.expect(pm.response.json().items.every(x => x.role === "Editor")).to.be.true;']] }),
  request('04 name search', 'GET', '/api/users', { query: 'search=Postman%20Managed', checks: [['name search honored', 'pm.expect(pm.response.json().items.some(x => x.name.includes("Postman Managed"))).to.be.true;']] }),
  request('05 invalid pagination', 'GET', '/api/users', { query: 'page=0&pageSize=101', expected: 400, checks: [errorCheck] }),
]);

folder('Users - GET /api/users/:id', [
  request('01 existing user', 'GET', '/api/users/{{managedUserId}}', { checks: [['returns requested ID', 'pm.expect(pm.response.json().id).to.eql(Number(pm.collectionVariables.get("managedUserId")));']] }),
  request('02 missing user', 'GET', '/api/users/999999999', { expected: 404, checks: [errorCheck] }),
  request('03 malformed ID', 'GET', '/api/users/not-a-number', { expected: 400, checks: [errorCheck] }),
  unauthorized('04 unauthorized', 'GET', '/api/users/{{managedUserId}}'),
  request('05 response contract', 'GET', '/api/users/{{managedUserId}}', { maxMs: 750, checks: [['user has profile fields', 'pm.expect(pm.response.json()).to.include.keys("id","email","name","role","status","createdAt");']] }),
]);

folder('Users - PATCH /api/users/:id', [
  request('01 update name and status', 'PATCH', '/api/users/{{managedUserId}}', { body: { name: 'Postman Updated User', status: 'pending' }, checks: [['update echoed', 'const b=pm.response.json(); pm.expect(b.id).to.eql(Number(pm.collectionVariables.get("managedUserId"))); pm.expect(b.name).to.eql("Postman Updated User");']] }),
  request('02 invalid email', 'PATCH', '/api/users/{{managedUserId}}', { expected: 400, body: { email: 'invalid' }, checks: [errorCheck] }),
  request('03 invalid role', 'PATCH', '/api/users/{{managedUserId}}', { expected: 400, body: { role: 'Owner' }, checks: [errorCheck] }),
  request('04 missing user', 'PATCH', '/api/users/999999999', { expected: 404, body: { name: 'Missing' }, checks: [errorCheck] }),
  unauthorized('05 unauthorized', 'PATCH', '/api/users/{{managedUserId}}', { body: { name: 'Blocked' } }),
]);

folder('Users - DELETE /api/users (batch)', [
  request('01 empty IDs', 'DELETE', '/api/users', { expected: 400, body: { ids: [] }, checks: [errorCheck] }),
  request('02 duplicate IDs', 'DELETE', '/api/users', { expected: 400, body: { ids: [1, 1] }, checks: [errorCheck] }),
  request('03 invalid ID value', 'DELETE', '/api/users', { expected: 400, body: { ids: [0] }, checks: [errorCheck] }),
  unauthorized('04 unauthorized', 'DELETE', '/api/users', { body: { ids: [999999999] } }),
  request('05 valid batch delete with missing IDs', 'DELETE', '/api/users', { body: { ids: [999999998, 999999999] }, checks: [['delete count returned', 'pm.expect(pm.response.json()).to.have.property("deleted").that.is.a("number");']] }),
]);

folder('Companies - POST /api/companies', [
  request('01 create company', 'POST', '/api/companies', { expected: 201, body: validCompany, checks: [['created company contract', 'const b=pm.response.json(); pm.expect(b.company_code).to.eql(pm.collectionVariables.get("companyCode")); pm.expect(b.level).to.eql(2);']] }),
  request('02 empty body', 'POST', '/api/companies', { expected: 400, body: {}, checks: [errorCheck] }),
  request('03 invalid level', 'POST', '/api/companies', { expected: 400, body: { ...validCompany, company_code: '{{badCompanyCode}}', level: 9 }, checks: [errorCheck] }),
  request('04 negative revenue', 'POST', '/api/companies', { expected: 400, body: { ...validCompany, company_code: '{{badCompanyCode}}', annual_revenue: -1 }, checks: [errorCheck] }),
  request('05 duplicate code', 'POST', '/api/companies', { expected: 409, body: validCompany, checks: [errorCheck] }),
]);

folder('Companies - GET /api/companies', [
  request('01 default list', 'GET', '/api/companies', { checks: [['company pagination contract', 'const b=pm.response.json(); pm.expect(b.items).to.be.an("array"); pm.expect(b).to.include.keys("total","page","pageSize");']] }),
  request('02 pagination', 'GET', '/api/companies', { query: 'page=1&pageSize=3', checks: [['page size honored', 'pm.expect(pm.response.json().items.length).to.be.at.most(3);']] }),
  request('03 level filter', 'GET', '/api/companies', { query: 'level=2', checks: [['level filter honored', 'pm.expect(pm.response.json().items.every(x => x.level === 2)).to.be.true;']] }),
  request('04 name search', 'GET', '/api/companies', { query: 'search=Postman%20Test', checks: [['company search honored', 'pm.expect(pm.response.json().items.some(x => x.company_code === pm.collectionVariables.get("companyCode"))).to.be.true;']] }),
  request('05 invalid query', 'GET', '/api/companies', { query: 'level=9&page=0', expected: 400, checks: [errorCheck] }),
]);

folder('Companies - GET /api/companies/:code', [
  request('01 existing company', 'GET', '/api/companies/{{companyCode}}', { checks: [['returns requested code', 'pm.expect(pm.response.json().company_code).to.eql(pm.collectionVariables.get("companyCode"));']] }),
  request('02 missing company', 'GET', '/api/companies/DOES_NOT_EXIST', { expected: 404, checks: [errorCheck] }),
  unauthorized('03 unauthorized', 'GET', '/api/companies/{{companyCode}}'),
  request('04 response fields', 'GET', '/api/companies/{{companyCode}}', { checks: [['company fields present', 'pm.expect(pm.response.json()).to.include.keys("company_code","company_name","level","country","city","founded_year","annual_revenue","employees","profit_efficiency");']] }),
  request('05 performance', 'GET', '/api/companies/{{companyCode}}', { maxMs: 750, checks: [['profit efficiency is numeric', 'pm.expect(pm.response.json().profit_efficiency).to.be.a("number");']] }),
]);

folder('Companies - PATCH /api/companies/:code', [
  request('01 valid update', 'PATCH', '/api/companies/{{companyCode}}', { body: { company_name: 'Postman Updated Supplier', employees: 125 }, checks: [['updated fields returned', 'const b=pm.response.json(); pm.expect(b.company_name).to.eql("Postman Updated Supplier"); pm.expect(b.employees).to.eql(125);']] }),
  request('02 invalid level', 'PATCH', '/api/companies/{{companyCode}}', { expected: 400, body: { level: 0 }, checks: [errorCheck] }),
  request('03 invalid year', 'PATCH', '/api/companies/{{companyCode}}', { expected: 400, body: { founded_year: 1500 }, checks: [errorCheck] }),
  request('04 missing company', 'PATCH', '/api/companies/DOES_NOT_EXIST', { expected: 404, body: { company_name: 'Missing' }, checks: [errorCheck] }),
  unauthorized('05 unauthorized', 'PATCH', '/api/companies/{{companyCode}}', { body: { company_name: 'Blocked' } }),
]);

folder('Dashboard - GET /api/dashboard', [
  request('01 dashboard data', 'GET', '/api/dashboard', { checks: [['dashboard contract', 'const b=pm.response.json(); pm.expect(b.stats).to.include.keys("companyCount","totalRevenue","countryCount","employeeCount"); pm.expect(b.levelDistribution).to.be.an("array"); pm.expect(b.foundedTrend).to.be.an("array");']] }),
  unauthorized('02 unauthorized', 'GET', '/api/dashboard'),
  request('03 stats types', 'GET', '/api/dashboard', { checks: [['stats are numeric', 'Object.values(pm.response.json().stats).forEach(v => pm.expect(v).to.be.a("number"));']] }),
  request('04 level percentages', 'GET', '/api/dashboard', { checks: [['percentages sum near 100', 'const sum=pm.response.json().levelDistribution.reduce((a,x)=>a+x.percentage,0); pm.expect(sum).to.be.closeTo(100,0.01);']] }),
  request('05 performance', 'GET', '/api/dashboard', { maxMs: 1000, checks: [['trend is cumulative', 'const a=pm.response.json().foundedTrend.map(x=>x.cumulative); pm.expect(a.every((v,i)=>i===0||v>=a[i-1])).to.be.true;']] }),
]);

folder('Dashboard - GET /api/dashboard/barchart/options', [
  request('01 filter options', 'GET', '/api/dashboard/barchart/options', { checks: [['options contract', 'const b=pm.response.json(); pm.expect(b.levels).to.eql([1,2,3,4]); pm.expect(b.countries).to.be.an("array"); pm.expect(b.cities).to.be.an("array"); pm.expect(b.ranges).to.include.keys("foundedYear","annualRevenue","employees");']] }),
  unauthorized('02 unauthorized', 'GET', '/api/dashboard/barchart/options'),
  request('03 range ordering', 'GET', '/api/dashboard/barchart/options', { checks: [['all min values do not exceed max', 'Object.values(pm.response.json().ranges).forEach(r => pm.expect(r.min).to.be.at.most(r.max));']] }),
  request('04 unique options', 'GET', '/api/dashboard/barchart/options', { checks: [['countries and cities are unique', 'const b=pm.response.json(); pm.expect(new Set(b.countries).size).to.eql(b.countries.length); pm.expect(new Set(b.cities).size).to.eql(b.cities.length);']] }),
  request('05 performance', 'GET', '/api/dashboard/barchart/options', { maxMs: 1000, checks: [['options are non-empty', 'const b=pm.response.json(); pm.expect(b.countries.length).to.be.above(0); pm.expect(b.cities.length).to.be.above(0);']] }),
]);

folder('Dashboard - POST /api/dashboard/barchart', [
  request('01 group by level', 'POST', '/api/dashboard/barchart', { body: { dimension: 'level', filter: {} }, checks: [['bar response contract', 'const b=pm.response.json(); pm.expect(b.dimension).to.eql("level"); pm.expect(b.total).to.be.a("number"); pm.expect(b.data).to.be.an("array");']] }),
  request('02 country filter', 'POST', '/api/dashboard/barchart', { body: { dimension: 'city', filter: { country: ['China'] } }, checks: [['filtered total is positive', 'pm.expect(pm.response.json().total).to.be.above(0);']] }),
  request('03 invalid dimension', 'POST', '/api/dashboard/barchart', { expected: 400, body: { dimension: 'industry', filter: {} }, checks: [errorCheck] }),
  request('04 reversed range', 'POST', '/api/dashboard/barchart', { expected: 400, body: { dimension: 'level', filter: { employees: { min: 1000, max: 10 } } }, checks: [errorCheck] }),
  unauthorized('05 unauthorized', 'POST', '/api/dashboard/barchart', { body: { dimension: 'level', filter: {} } }),
]);

folder('Dashboard - POST /api/dashboard/bubblechart', [
  request('01 full hierarchy', 'POST', '/api/dashboard/bubblechart', { body: { filter: {} }, checks: [['bubble response contract', 'const b=pm.response.json(); pm.expect(b.total).to.be.a("number"); pm.expect(b.hierarchy.code).to.eql("ROOT"); pm.expect(b.hierarchy.children).to.be.an("array");']] }),
  request('02 level filter', 'POST', '/api/dashboard/bubblechart', { body: { filter: { level: [2] } }, checks: [['total equals matched hierarchy nodes', 'const b=pm.response.json(); const walk=n=>[n,...(n.children||[]).flatMap(walk)]; const matched=walk(b.hierarchy).filter(n=>n.matched).length; pm.expect(b.total).to.eql(matched); pm.expect(b.total).to.be.above(0);']] }),
  request('03 combined empty result', 'POST', '/api/dashboard/bubblechart', { body: { filter: { country: ['Nowhere'], city: ['Missing'] } }, checks: [['empty hierarchy is valid', 'const b=pm.response.json(); pm.expect(b.total).to.eql(0); pm.expect(b.hierarchy.children).to.eql([]);']] }),
  request('04 reversed range', 'POST', '/api/dashboard/bubblechart', { expected: 400, body: { filter: { annual_revenue: { min: 500000, max: 100 } } }, checks: [errorCheck] }),
  unauthorized('05 unauthorized', 'POST', '/api/dashboard/bubblechart', { body: { filter: {} } }),
]);

folder('Companies - DELETE /api/companies/:code', [
  request('01 delete existing company', 'DELETE', '/api/companies/{{companyCode}}', { checks: [['deleted code returned', 'pm.expect(pm.response.json().company_code).to.eql(pm.collectionVariables.get("companyCode"));']] }),
  request('02 delete same company again', 'DELETE', '/api/companies/{{companyCode}}', { expected: 404, checks: [errorCheck] }),
  request('03 delete missing company', 'DELETE', '/api/companies/DOES_NOT_EXIST', { expected: 404, checks: [errorCheck] }),
  unauthorized('04 unauthorized', 'DELETE', '/api/companies/C001'),
  request('05 verify deleted company is absent', 'GET', '/api/companies/{{companyCode}}', { expected: 404, checks: [errorCheck] }),
]);

folder('Users - DELETE /api/users/:id and cleanup', [
  request('01 malformed ID', 'DELETE', '/api/users/not-a-number', { expected: 400, checks: [errorCheck] }),
  request('02 missing user', 'DELETE', '/api/users/999999999', { expected: 404, checks: [errorCheck] }),
  unauthorized('03 unauthorized', 'DELETE', '/api/users/{{managedUserId}}'),
  request('04 delete managed user', 'DELETE', '/api/users/{{managedUserId}}', { checks: [['deleted ID returned', 'pm.expect(pm.response.json().id).to.eql(Number(pm.collectionVariables.get("managedUserId")));']] }),
  request('05 delete current test user', 'DELETE', '/api/users/{{authUserId}}', { checks: [['auth test user deleted', 'pm.expect(pm.response.json().id).to.eql(Number(pm.collectionVariables.get("authUserId")));']] }),
]);

const collection = {
  info: {
    _postman_id: 'a3d71439-7d33-4b95-a81c-2403ae649e02',
    name: 'Dashboard API - Complete Test Suite',
    description: '18 API endpoints with approximately five scenarios per endpoint. Tests cover connectivity/status codes, empty and malformed input, response JSON/contracts, authorization, and performance.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: [
    'if (!pm.collectionVariables.get("runId")) {',
    '  const id = Date.now().toString();',
    '  pm.collectionVariables.set("runId", id);',
    '  pm.collectionVariables.set("authEmail", `postman.auth.${id}@example.com`);',
    '  pm.collectionVariables.set("mismatchEmail", `postman.mismatch.${id}@example.com`);',
    '  pm.collectionVariables.set("unknownEmail", `postman.unknown.${id}@example.com`);',
    '  pm.collectionVariables.set("managedEmail", `postman.managed.${id}@example.com`);',
    '  pm.collectionVariables.set("invalidRoleEmail", `postman.role.${id}@example.com`);',
    '  pm.collectionVariables.set("companyCode", `PM${id}`);',
    '  pm.collectionVariables.set("badCompanyCode", `BAD${id}`);',
    '}',
  ] } }],
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3001', type: 'string' },
    { key: 'runId', value: '' }, { key: 'accessToken', value: '' },
    { key: 'authUserId', value: '' }, { key: 'managedUserId', value: '' },
  ],
  item: folders,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(collection, null, 2)}\n`);
console.log(`Generated ${output}`);
console.log(`${folders.length} endpoint folders, ${folders.reduce((sum, f) => sum + f.item.length, 0)} requests`);
