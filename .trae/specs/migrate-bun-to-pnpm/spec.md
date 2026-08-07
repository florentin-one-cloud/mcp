# Migrate from Bun to pnpm Spec

## Why

The repository's package manager rule mandates pnpm v11 as the sole package manager. The codebase currently uses Bun
1.3.0 as the runtime, package manager, test runner, and build tool. This migration aligns the project with the governed
toolchain standard.

## What Changes

- Replace Bun runtime with Node.js 22 as the target engine (**BREAKING**)
- Replace `bun.lock` with `pnpm-lock.yaml`
- Replace inline bun workspaces with `pnpm-workspace.yaml`
- Replace `bun build` with `tsup` for workspace package builds
- Replace `bun test` with `vitest` for testing
- Replace `bunx` with `pnpm exec` in all scripts
- Replace `oven-sh/setup-bun@v2` with `pnpm/action-setup@v4` in CI
- Remove Bun-specific TypeScript config (`@tsconfig/bun`, `@types/bun`)
- Remove `Bun` global from eslint config

## Impact

- Affected specs: N/A (new spec)
- Affected code:
  - Root `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`
  - `.github/workflows/deploy.yml`
  - All 7 workspace `package.json` files
  - All 11 test files using `bun:test`
  - New files: `.npmrc`, `pnpm-workspace.yaml`, `vitest.config.ts` (root + per workspace)
  - Removed: `bun.lock`

## ADDED Requirements

### Requirement: PNPM v11 Package Manager

The system SHALL use pnpm v11 as the sole package manager, declared via `packageManager` in root `package.json`,
enforced by `engine-strict=true` in `.npmrc`.

#### Scenario: Install dependencies

- **WHEN** developer runs `pnpm install --frozen-lockfile`
- **THEN** dependencies install deterministically from `pnpm-lock.yaml`

#### Scenario: Workspace resolution

- **WHEN** workspace packages declare inter-dependencies
- **THEN** `pnpm-workspace.yaml` resolves workspace packages under `src/*`

### Requirement: Package Manager Metadata

The root `package.json` SHALL declare `"packageManager": "pnpm@11.0.0"` and `.npmrc` SHALL contain `engine-strict=true`.

#### Scenario: Verify package manager

- **WHEN** running any pnpm command
- **THEN** corepack enforces pnpm v11 without prompting

### Requirement: CI/CD Uses PNPM

GitHub Actions workflows SHALL use `pnpm/action-setup@v4` with `version: 11`, `actions/setup-node@v4` with
`node-version: 22` and `cache: pnpm`, and `pnpm install --frozen-lockfile`.

#### Scenario: CI build

- **WHEN** push to main triggers deploy workflow
- **THEN** build job uses pnpm for install, build, type check, and test

#### Scenario: CI deploy

- **WHEN** deploy job runs for each worker
- **THEN** `cloudflare/wrangler-action@v4` receives `packageManager: pnpm`

### Requirement: Build Scripts Use tsup

All workspace `package.json` build scripts SHALL use `tsup` to bundle `src/index.ts` and `src/worker.ts` for Cloudflare
Workers deployment.

#### Scenario: Build workspace package

- **WHEN** `pnpm run build-all` is invoked from root
- **THEN** each workspace builds into `dist/` with correct ESM output

### Requirement: Test Scripts Use Vitest

All workspace `package.json` test scripts SHALL use `vitest` and all test files SHALL import from `vitest` instead of
`bun:test`.

#### Scenario: Run tests

- **WHEN** `pnpm run test:all` is invoked from root
- **THEN** vitest runs all workspace test suites and reports results

## REMOVED Requirements

### Requirement: Bun Runtime

**Reason**: The project standardizes on Node.js 22 via pnpm v11. All Bun-specific tooling (`@tsconfig/bun`,
`@types/bun`, `oven-sh/setup-bun`, `bun.lock`, `bun build`, `bun test`, `bunx`) is replaced. **Migration**: `bun.lock`
deleted. `engines.bun` fields removed. Bun global removed from eslint. `bun:test` imports replaced with `vitest`.
