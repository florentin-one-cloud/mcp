# Establish Comprehensive Testing Framework Spec

## Why

The `@florentin-one/mcp` monorepo has vitest configured but zero test files. The CI pipeline (`deploy.yml`) runs `pnpm run test:all` only on main-branch push — no PR gating, no tiered execution, no Cloudflare-specific mocking, no error aggregation. A solo developer maintaining this codebase with a target of ~1 active maintenance month per year requires a testing framework that is self-documenting, low-overhead, and automated to the point where 90% of feature workflows never touch test infrastructure outside the annual maintenance window.

## What Changes

- **Add tiered vitest test suites** (unit, integration, E2E) with strict time budgets enforced via vitest configuration
- **Add `miniflare`** for local Cloudflare Workers simulation with KV/R2/D1 mocking, eliminating cloud resource costs during development
- **Add PR CI workflow** (`test.yml`) that gates merges on unit + integration pass, blocks deployment on critical failures, flags non-blocking warnings
- **Add test templates** (`templates/`) with standardized schemas for unit, integration, and E2E tests — self-documenting, copy-paste ready
- **Add test deprecation workflow** — a script that detects tests referencing removed source files and flags them for cleanup
- **Add error aggregation** — GitHub Actions artifact-based test report persistence with historical trend visibility
- **Add `wrangler` E2E smoke tests** — sparse, main-branch-only validation of deployed worker endpoints
- **Modify root `vitest.config.ts`** to support tiered project configuration with per-tier timeouts
- **Modify `deploy.yml`** to consume test artifacts from `test.yml` and enforce deployment gate

## Impact

- Affected specs: none (greenfield testing infrastructure)
- Affected code:
  - `vitest.config.ts` (root) — tiered workspace configuration
  - `src/florentin-one-mcp/vitest.config.ts` — package-level config
  - `.github/workflows/deploy.yml` — deployment gate integration
  - New: `.github/workflows/test.yml` — PR CI pipeline
  - New: `templates/` — test templates directory
  - New: `scripts/test-cleanup.ts` — deprecation detection
  - New: `src/*/__tests__/` — test directories per package

## ADDED Requirements

### Requirement: Tiered Test Execution

The system SHALL support three test tiers with enforced time budgets: unit (<10s), integration (<60s), E2E (no hard budget, main-branch-only).

#### Scenario: Unit tests execute in under 10 seconds

- **WHEN** developer runs `pnpm run test:unit`
- **THEN** all unit tests complete within 10 seconds
- **AND** only `__tests__/unit/**` files are executed

#### Scenario: Integration tests execute in under 60 seconds

- **WHEN** developer runs `pnpm run test:integration`
- **THEN** all integration tests complete within 60 seconds
- **AND** Cloudflare service mocks (KV, R2, D1) are used instead of live services

#### Scenario: E2E tests skip on PR

- **WHEN** a PR is opened
- **THEN** E2E tests are NOT executed in CI
- **AND** only unit + integration tiers run

#### Scenario: E2E tests run on main

- **WHEN** a commit lands on `main` branch
- **THEN** E2E smoke tests execute against the deployed worker

### Requirement: Cloudflare Workers Local Simulation

The system SHALL use `miniflare` to simulate Cloudflare Workers runtime locally, including KV, R2, and D1 service mocking.

#### Scenario: KV mock in integration test

- **WHEN** an integration test reads from KV namespace
- **THEN** the read is served by miniflare's in-memory KV simulation
- **AND** no Cloudflare API call is made

#### Scenario: R2 mock in integration test

- **WHEN** an integration test writes to R2 bucket
- **THEN** the write is captured by miniflare's in-memory R2 simulation
- **AND** no cloud storage cost is incurred

### Requirement: PR CI Pipeline with Test Gating

The system SHALL provide a GitHub Actions workflow (`test.yml`) triggered on PR open, push, and main-branch commits that runs tiered tests and reports results as status checks.

#### Scenario: PR with failing unit tests blocks merge

- **WHEN** a PR has failing unit tests
- **THEN** the CI status check reports failure
- **AND** the PR cannot be merged (branch protection)

#### Scenario: PR with only non-blocking warnings allows merge

- **WHEN** a PR has passing unit + integration tests but flagged deprecation warnings
- **THEN** the CI status check reports success with annotations
- **AND** the PR can be merged

#### Scenario: Main-branch commit runs all tiers including E2E

- **WHEN** code is pushed to `main`
- **THEN** unit, integration, AND E2E tests execute
- **AND** deployment is blocked if any tier fails

### Requirement: Self-Documenting Test Templates

The system SHALL provide standardized test templates for unit, integration, and E2E tests with inline documentation and schema enforcement.

#### Scenario: Developer creates a new unit test

- **WHEN** developer copies `templates/unit.test.ts` to their package
- **THEN** the template contains inline comments explaining structure, mocking patterns, and assertion style
- **AND** the template imports from a shared test utilities module

#### Scenario: Template enforces consistent structure

- **WHEN** a test file follows the template schema
- **THEN** it uses `describe`/`it` blocks with standardized naming conventions
- **AND** it uses the shared mock factory for Cloudflare bindings

### Requirement: Automatic Test Deprecation Detection

The system SHALL provide a script that identifies test files referencing removed or renamed source modules and flags them for cleanup.

#### Scenario: Source file removed, test remains

- **WHEN** developer runs `pnpm run test:cleanup`
- **THEN** the script scans all test files for imports of non-existent source modules
- **AND** outputs a report listing orphaned tests with file paths and line numbers
- **AND** exits with code 0 (non-blocking) but prints warnings

#### Scenario: All tests reference valid sources

- **WHEN** developer runs `pnpm run test:cleanup`
- **THEN** the script reports "0 orphaned tests found"
- **AND** exits with code 0

### Requirement: Centralized Error Aggregation

The system SHALL aggregate test failure data across CI runs using GitHub Actions artifacts, enabling historical trend analysis during annual maintenance windows.

#### Scenario: CI run stores test report artifact

- **WHEN** any test tier completes in CI
- **THEN** a JSON test report is uploaded as a GitHub Actions artifact
- **AND** the artifact is named `test-report-{tier}-{run-id}.json`

#### Scenario: Maintenance review queries historical failures

- **WHEN** developer runs `pnpm run test:history`
- **THEN** the script downloads recent test report artifacts
- **AND** outputs a summary of recurring failure patterns sorted by frequency

### Requirement: Deployment Gate Integration

The system SHALL modify `deploy.yml` to verify that the corresponding `test.yml` run passed before proceeding with deployment.

#### Scenario: Deployment blocked by test failure

- **WHEN** `deploy.yml` is triggered on main push
- **THEN** it checks the latest `test.yml` conclusion for the same commit SHA
- **AND** if tests failed, deployment is aborted with an error message

#### Scenario: Deployment proceeds after test pass

- **WHEN** `deploy.yml` is triggered and tests passed
- **THEN** deployment proceeds normally

## MODIFIED Requirements

### Requirement: Root Vitest Configuration

The root `vitest.config.ts` SHALL be restructured to define a workspace with tiered projects (unit, integration, E2E) rather than a flat `src/*` glob.

#### Scenario: Running a specific tier

- **WHEN** developer runs `vitest run --project unit`
- **THEN** only unit test files matching `__tests__/unit/**` are executed
- **AND** the unit timeout of 10s is enforced

## REMOVED Requirements

None.