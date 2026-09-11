# Postman API Test Suite

## AI 基础能力测试

导入 `ai.postman_collection.json`，或执行 `npx newman run ai.postman_collection.json`。
要求基础服务已启动，后端使用本地默认单租户配置；集合会创建独立测试账号，使用 Mock 模型运行，末尾删除该账号。
44 个请求覆盖本次新增 CRUD、分页/非法输入、缓存命中、任务状态和审计权限；实际执行 189 条断言全部通过。
跨租户、管理员、真实 TTL、并发和 Checkpointer 测试见 `backend/test/ai-foundation.e2e-spec.ts`。不要导出或提交运行后填充的 token。

## 原业务 API 测试

This folder contains an importable Postman collection and local environment for all 18 backend endpoints.

## Coverage

- Status code and connectivity
- Empty and malformed input
- Authentication and authorization failures
- JSON content type and parseability
- Response body fields and business values
- Response time thresholds
- CRUD lifecycle and cleanup of generated test data

Every endpoint has approximately five independent scenarios. Test data uses a timestamp-based run ID and does not overwrite seeded company data.

## Run

```bash
cd postman
npm install
npm test
```

Reports are written to `postman/reports/newman-report.html` and `postman/reports/newman-report.json`.

The verified local run on 2026-08-26 executed 90 requests and 450 assertions with zero failures and zero skipped tests. The delivery also includes:

- `reports/TEST_SUMMARY.md`
- `reports/screenshots/swagger-ui.png`
- `reports/screenshots/newman-summary.png`
- `../output/pdf/swagger.pdf`

To run in the Postman desktop app, import:

- `api.postman_collection.json`
- `local.postman_environment.json`
