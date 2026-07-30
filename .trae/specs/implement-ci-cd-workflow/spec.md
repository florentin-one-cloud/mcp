# Cloudflare Workers Deployment Workflow Refactor

## Why
The current `deploy.yml` is a minimal skeleton that lacks dependency installation, build steps, type checking, testing, and multi-worker deployment. This monorepo contains 1 gateway worker and 7 service workers (collaborative-reasoning, constraint-solver, metacognitive-monitoring, narrative-planner, scientific-method, sequential-thinking, structured-argumentation), each with their own `wrangler.jsonc`. The workflow MUST build all workers and deploy them in the correct order (services first, then gateway) to ensure service bindings resolve.

## What Changes
- Replace the minimal deploy.yml with a production-grade multi-stage workflow
- Add explicit `bun install` step
- Add `bun run build-all` step (builds all workers via workspace filter)
- Add type checking step (`tsc --noEmit`)
- Add optional test step (`bun run test:all`)
- Deploy all 7 service workers in parallel using a matrix strategy
- Deploy gateway worker after all service workers succeed
- Pin wrangler-action to v4 with explicit `packageManager: bun`
- Add `concurrency` group to prevent overlapping deployments
- Reduce timeout from 60 to 15 minutes per job
- Add `workflow_dispatch` trigger for manual re-deploys

## Impact
- Affected specs: CI/CD pipeline, deployment orchestration
- Affected code: `.github/workflows/deploy.yml`

## MODIFIED Requirements
### Requirement: Deploy Workflow
The CI/CD pipeline SHALL install dependencies, build all workers, run type checks, execute tests, and deploy all workers to Cloudflare in dependency order.

#### Scenario: Push to main triggers full pipeline
- **WHEN** a commit is pushed to `main`
- **THEN** dependencies are installed, all workers are built, types are checked, tests pass, service workers deploy in parallel, and the gateway deploys last

#### Scenario: Manual deployment trigger
- **WHEN** a developer triggers `workflow_dispatch`
- **THEN** the same pipeline executes without requiring a new commit

#### Scenario: Build or type check failure
- **WHEN** `tsc --noEmit` or `bun run build-all` fails
- **THEN** deployment is aborted and the workflow reports failure

#### Scenario: Test failure
- **WHEN** `bun run test:all` fails
- **THEN** deployment is aborted

## Constraints
- MUST use `bun` as the package manager (project uses `bun.lock` and `packageManager: "bun@1.3.0"`)
- MUST NOT hardcode secrets in workflow files
- MUST deploy service workers before the gateway (gateway has service bindings to all services)
- MUST use `cloudflare/wrangler-action@v4`
- MUST pass `apiToken` and `accountId` from GitHub secrets
