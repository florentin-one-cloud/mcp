# Checklist

- [x] concurrency group is set (group: deploy-main, cancel-in-progress: true)
- [x] workflow_dispatch trigger is present
- [x] timeout-minutes reduced from 60 to 10
- [x] oven-sh/setup-bun@v2 step installs Bun
- [x] bun install step runs before build
- [x] bun run build-all compiles all workers
- [x] bun run check (tsc --noEmit) passes
- [x] bun run test:all passes
- [x] matrix strategy deploys all 7 service workers in parallel
- [x] gateway deploy job depends on service matrix and runs last
- [x] each matrix entry uses workingDirectory: src/${{ matrix.worker }}
- [x] wrangler-action@v4 with packageManager: bun
- [x] apiToken and accountId come from secrets (not hardcoded)
- [x] gateway wrangler.jsonc has all 7 service bindings defined
- [x] no secrets are logged or hardcoded in the workflow file
