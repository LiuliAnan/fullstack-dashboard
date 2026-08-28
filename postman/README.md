# Postman API Test Suite

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
