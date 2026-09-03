import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourceUrl = process.env.OPENAPI_URL ?? 'http://localhost:3001/api/docs-json';
const outputPath = resolve(process.cwd(), process.argv[2] ?? '../docs/openapi.json');

const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Unable to fetch ${sourceUrl}: HTTP ${response.status}`);
}

const document = await response.json();
const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
const operations = Object.entries(document.paths ?? {}).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({ path, method, operation })),
);

const problems = [];
for (const { path, method, operation } of operations) {
  const label = `${method.toUpperCase()} ${path}`;
  if (!operation.summary) problems.push(`${label}: missing summary`);
  if (!operation.tags?.length) problems.push(`${label}: missing tag`);
  if (!operation.responses || Object.keys(operation.responses).length === 0) {
    problems.push(`${label}: missing responses`);
  }
  if (operation.security?.length && !operation.responses?.['401']) {
    problems.push(`${label}: protected operation is missing a 401 response`);
  }
}

const expectedOperations = Number(process.env.EXPECTED_OPENAPI_OPERATIONS || 24);
if (operations.length !== expectedOperations) {
  problems.push(`Expected ${expectedOperations} operations, found ${operations.length}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`Exported ${operations.length} operations to ${outputPath}`);
for (const tag of document.tags ?? []) {
  const count = operations.filter(({ operation }) => operation.tags?.includes(tag.name)).length;
  console.log(`  ${tag.name}: ${count}`);
}

if (problems.length) {
  console.error(problems.map((problem) => `- ${problem}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('OpenAPI validation passed.');
}
