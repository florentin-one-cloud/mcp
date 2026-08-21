# Tasks

- [x] Task 1: Restructure vitest configuration for tiered test execution
  - [x] SubTask 1.1: Rewrite root `vitest.config.ts` to define workspace projects for unit, integration, and E2E tiers with per-tier timeouts (unit: 10s, integration: 60s, E2E: no limit)
  - [x] SubTask 1.2: Rewrite `src/florentin-one-mcp/vitest.config.ts` to extend root tiered config with package-specific settings
  - [x] SubTask 1.3: Add `test:unit`, `test:integration`, `test:e2e` scripts to root `package.json` and `src/florentin-one-mcp/package.json`

- [x] Task 2: Add miniflare for local Cloudflare Workers simulation
  - [x] SubTask 2.1: Install `miniflare` and `@cloudflare/vitest-pool-workers` as devDependencies in root `package.json`
  - [x] SubTask 2.2: Create `src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts` with factory functions for KV, R2, and D1 mock bindings using miniflare
  - [x] SubTask 2.3: Configure vitest integration project to use miniflare environment for Cloudflare API mocking

- [x] Task 3: Create self-documenting test templates
  - [x] SubTask 3.1: Create `templates/unit.test.ts` — unit test template with inline documentation, standardized `describe`/`it` structure, and import of shared test utilities
  - [x] SubTask 3.2: Create `templates/integration.test.ts` — integration test template with Cloudflare mock setup, cross-module workflow patterns
  - [x] SubTask 3.3: Create `templates/e2e.test.ts` — E2E test template with wrangler deployment validation patterns
  - [x] SubTask 3.4: Create `templates/README.md` — one-page quickstart guide for copying and using templates

- [x] Task 4: Create PR CI workflow (`test.yml`)
  - [x] SubTask 4.1: Create `.github/workflows/test.yml` with triggers on `pull_request` (open, synchronize) and `push` to `main`
  - [x] SubTask 4.2: Configure job matrix for unit and integration tiers running in parallel
  - [x] SubTask 4.3: Add E2E job that runs only on `push` to `main`, not on PR events
  - [x] SubTask 4.4: Add test report artifact upload step (JSON format) for each tier
  - [x] SubTask 4.5: Add deprecation check step that runs `pnpm run test:cleanup` and annotates PR with warnings (non-blocking)

- [x] Task 5: Modify deploy.yml for deployment gating
  - [x] SubTask 5.1: Add a `check-tests` job before `build` that queries the `test.yml` workflow conclusion for the current commit SHA via GitHub API
  - [x] SubTask 5.2: Abort deployment if test conclusion is `failure` or `cancelled`
  - [x] SubTask 5.3: Add `workflow_run` trigger on `deploy.yml` so it can be triggered by `test.yml` completion on main

- [x] Task 6: Create test deprecation detection script
  - [x] SubTask 6.1: Create `scripts/test-cleanup.ts` that scans all `__tests__/` directories, resolves import paths, and flags imports referencing non-existent source files
  - [x] SubTask 6.2: Add `test:cleanup` script to root `package.json`
  - [x] SubTask 6.3: Ensure script exits code 0 with warnings (never blocks CI)

- [x] Task 7: Create error aggregation and history script
  - [x] SubTask 7.1: Create `scripts/test-history.ts` that downloads test report artifacts from recent GitHub Actions runs using the GitHub API
  - [x] SubTask 7.2: Parse and aggregate failure patterns, output sorted by frequency
  - [x] SubTask 7.3: Add `test:history` script to root `package.json`

- [x] Task 8: Write proof-of-concept tests for existing codebase
  - [x] SubTask 8.1: Write unit tests for `src/florentin-one-mcp/src/core/metacognitive-monitoring/analyzer.ts` covering knowledge assessment and confidence calculation
  - [x] SubTask 8.2: Write unit tests for `src/florentin-one-mcp/src/core/sequential-thinking/tracker.ts` covering thought sequencing and termination logic
  - [x] SubTask 8.3: Write integration test for the MCP agent server endpoint using miniflare, validating tool discovery response
  - [x] SubTask 8.4: Write E2E smoke test that deploys to a preview environment and validates the worker responds to an MCP `tools/list` request

- [x] Task 9: Add shared test utilities module
  - [x] SubTask 9.1: Create `src/shared/test-utils/index.ts` with common assertion helpers, mock factories, and test fixture generators
  - [x] SubTask 9.2: Export `createMockExecutionContext`, `createMockEnv`, and `assertMCPResponse` utilities

- [x] Task 10: Documentation and maintenance guide
  - [x] SubTask 10.1: Create `docs/testing-framework.md` covering architecture overview, tier strategy, template usage, CI pipeline, and annual maintenance procedures
  - [x] SubTask 10.2: Document extension points: how to add a new test tier, how to add a new Cloudflare service mock, how to customize CI gating rules

# Task Dependencies

- Task 2 depends on Task 1 (miniflare config needs tiered vitest structure)
- Task 3 depends on Task 2 (templates reference Cloudflare mock helpers)
- Task 4 depends on Task 1 (CI workflow runs tiered test commands)
- Task 5 depends on Task 4 (deploy gate checks test.yml)
- Task 8 depends on Tasks 1, 2, 3, 9 (tests need config, mocks, templates, and utilities)
- Task 9 can run in parallel with Tasks 1-3
- Tasks 6 and 7 can run in parallel with Tasks 4-5
- Task 10 depends on all other tasks