# Tasks

- [x] Task 1: Update root package.json and tooling configs
  - [x] SubTask 1.1: Update root `package.json` — change `engines` to Node 22, `packageManager` to `pnpm@11.0.0`,
        replace all `bun`/`bunx` script invocations with `pnpm`/`pnpm exec` equivalents, remove `bun run --filter` usage
        with `pnpm -r` equivalents
  - [x] SubTask 1.2: Create `.npmrc` with `engine-strict=true`
  - [x] SubTask 1.3: Create `pnpm-workspace.yaml` with `packages: ["src/*"]`
  - [x] SubTask 1.4: Delete `bun.lock`

- [x] Task 2: Update root dev tooling configs
  - [x] SubTask 2.1: Update `tsconfig.json` — no changes needed (did not extend `@tsconfig/bun`)
  - [x] SubTask 2.2: Update `eslint.config.mjs` — removed `Bun: "readonly"` global
  - [x] SubTask 2.3: Update `.gitignore` — added `.pnpm-store/`, removed `bun.lockb` and `.bun/` entries

- [x] Task 3: Reinstall dependencies with pnpm
  - [x] SubTask 3.1: Cleaned bun node_modules
  - [x] SubTask 3.2: Ran `pnpm install` to generate `pnpm-lock.yaml`
  - [x] SubTask 3.3: Updated root devDependencies — removed `@tsconfig/bun`, `@types/bun`; added `vitest`, `tsup` pinned
        to exact versions; pinned all versions

- [x] Task 4: Update all 7 workspace package.json files
  - [x] SubTask 4.1: Removed `engines.bun` field from all 7 workspaces
  - [x] SubTask 4.2: Replaced `bun build` build script with `tsup && tsc`
  - [x] SubTask 4.3: Replaced `bun test` with `vitest run`
  - [x] SubTask 4.4: Replaced `bunx wrangler deploy` with `pnpm exec wrangler deploy`
  - [x] SubTask 4.5: Replaced `bun run ./dist/index.js` with `node ./dist/index.js`

- [x] Task 5: Create vitest and tsup configs
  - [x] SubTask 5.1: Created root `vitest.config.ts` with workspace configuration
  - [x] SubTask 5.2: Created `tsup.config.ts` for each workspace (7 total)
  - [x] Created `vitest.config.ts` for each workspace (7 total, needed for vitest workspace resolution)

- [x] Task 6: Migrate all test files from bun:test to vitest
  - [x] SubTask 6.1: Replaced `import { ... } from "bun:test"` with `import { ... } from "vitest"` in all 11 test files
  - [x] SubTask 6.2: Verified zero remaining `bun:test` imports

- [x] Task 7: Update GitHub Actions deploy workflow
  - [x] SubTask 7.1: Replaced `oven-sh/setup-bun@v2` with `pnpm/action-setup@v4` (version: 11) + `actions/setup-node@v4`
        (node 22, cache: pnpm)
  - [x] SubTask 7.2: Replaced `bun install` with `pnpm install --frozen-lockfile`
  - [x] SubTask 7.3: Replaced `bun run build-all` with `pnpm run build-all`
  - [x] SubTask 7.4: Replaced `bun run check` with `pnpm run check`
  - [x] SubTask 7.5: Replaced `bun run test:all` with `pnpm run test:all`
  - [x] SubTask 7.6: Changed `packageManager: bun` to `packageManager: pnpm`

- [x] Task 8: Verify the migration
  - [x] SubTask 8.1: `pnpm install --frozen-lockfile` — passes (exit 0)
  - [x] SubTask 8.2: `pnpm run build-all` — passes, all 7 packages built
  - [x] SubTask 8.3: `pnpm run check` — passes (typecheck OK)
  - [x] SubTask 8.4: `pnpm run test:all` — passes, all test suites green

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 4
- Task 6 depends on Task 5 (vitest must be available)
- Task 7 depends on Task 1 (CI references root scripts)
- Task 8 depends on Tasks 3, 4, 5, 6, 7
