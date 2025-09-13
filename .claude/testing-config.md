---
framework: jest
test_command: npm test
created: 2025-09-13T20:19:14Z
---

# Testing Configuration

## Framework
- Type: Jest (Next.js)
- Version: 29.7.0
- Config File: jest.config.js

## Test Structure
- Test Directory: ./lib/auth/__tests__, ./tests
- Test Files: 3 files found
- Naming Pattern: *.test.ts, *.spec.ts

## Commands
- Run All Tests: `npm test`
- Run Specific Test: `npm test -- --testPathPattern={filename}`
- Run with Debugging: `npm test -- --verbose --no-coverage`

## Environment
- Required ENV vars: NODE_ENV=test (automatically set)
- Test Database: Not required
- Test Servers: Mock implementations in jest.setup.js

## Test Runner Agent Configuration
- Use verbose output for debugging
- Run tests sequentially (no parallel)
- Capture full stack traces
- No mocking - use real implementations
- Wait for each test to complete

## Discovered Test Files
1. `./lib/auth/__tests__/organization-context.test.ts` - Authentication unit tests
2. `./tests/e2e/authentication.spec.ts` - E2E authentication tests (Playwright)
3. `./tests/staging/production-readiness.spec.ts` - Production staging tests

## Jest Configuration Details
- Environment: jsdom
- Setup: jest.setup.js with Logto mocks
- Coverage: 70% threshold for branches/functions/lines/statements
- Path mapping: @/* -> <rootDir>/*
- Excludes: node_modules, .next, E2E tests from unit test runs