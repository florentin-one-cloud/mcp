# Tasks

- [ ] Task 1: Add concurrency group and workflow_dispatch trigger
  - [ ] SubTask 1.1: Add `concurrency` block to prevent overlapping deploys on `main`
  - [ ] SubTask 1.2: Add `workflow_dispatch` trigger for manual re-deploys
  - [ ] SubTask 1.3: Reduce `timeout-minutes` from 60 to 15

- [ ] Task 2: Add install and build steps
  - [ ] SubTask 2.1: Add `oven-sh/setup-bun@v2` action to install Bun
  - [ ] SubTask 2.2: Add `bun install` step
  - [ ] SubTask 2.3: Add `bun run build-all` step

- [ ] Task 3: Add quality gate steps (type check + tests)
  - [ ] SubTask 3.1: Add `bun run check` step (tsc --noEmit)
  - [ ] SubTask 3.2: Add `bun run test:all` step

- [ ] Task 4: Replace single deploy step with multi-worker deployment
  - [ ] SubTask 4.1: Add matrix job to deploy all 7 service workers in parallel (collaborative-reasoning, constraint-solver, metacognitive-monitoring, narrative-planner, scientific-method, sequential-thinking, structured-argumentation) using `workingDirectory: src/${{ matrix.worker }}`
  - [ ] SubTask 4.2: Add final gateway deploy job that depends on the service matrix, deploying from `src/gateway`

# Task Dependencies
- Task 2 depends on Task 1 (concurrency/trigger setup first)
- Task 3 depends on Task 2 (build must succeed before type check)
- Task 4 depends on Task 3 (quality gates must pass before deploy)
