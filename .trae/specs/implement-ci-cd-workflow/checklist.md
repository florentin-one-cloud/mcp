# Checklist

- [ ] concurrency group is set (group: deploy-main, cancel-in-progress: true)
- [ ] workflow_dispatch trigger is present
- [ ] timeout-minutes reduced from 60 to 15
- [ ] oven-sh/setup-bun@v2 step installs Bun
- [ ] bun install step runs before build
- [ ] bun run build-all compiles all workers
- [ ] bun run check (tsc --noEmit) passes
- [ ] bun run test:all passes
- [ ] matrix strategy deploys all 7 service workers in parallel
- [ ] gateway deploy job depends on service matrix and runs last
- [ ] each matrix entry uses workingDirectory: src/${{ matrix.worker }}
- [ ] wrangler-action@v4 with packageManager: bun
- [ ] apiToken and accountId come from secrets (not hardcoded)
- [ ] gateway wrangler.jsonc has all 7 service bindings defined
- [ ] no secrets are logged or hardcoded in the workflow file
