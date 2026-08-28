# Tasks

- [ ] Task 1: Rename source directory from `src/florentin-one-mcp/` to `src/kette/`
  - [ ] SubTask 1.1: Execute `mv src/florentin-one-mcp src/kette`
  - [ ] SubTask 1.2: Update `pnpm-workspace.yaml` if needed (it uses `src/*` glob, so no change required — verify)

- [ ] Task 2: Update package identity in `src/kette/package.json`
  - [ ] SubTask 2.1: Change `name` from `@florentin-one/mcp` to `@florentin-one/kette`
  - [ ] SubTask 2.2: Change `description` to reflect Kette branding and HTAD alignment
  - [ ] SubTask 2.3: Change `bin` entry from `florentin-one-mcp` to `kette`
  - [ ] SubTask 2.4: Update `homepage` URL to reference `src/kette`
  - [ ] SubTask 2.5: Update `repository.directory` to `src/kette`
  - [ ] SubTask 2.6: Update `keywords` to include HTAD-relevant terms (wertschöpfungskette, vertikale-ki, industrielle-ki, domänenspezifisch)

- [ ] Task 3: Update root `package.json`
  - [ ] SubTask 3.1: Change `name` from `mcp` to `kette`
  - [ ] SubTask 3.2: Update `description` to reflect Kette branding

- [ ] Task 4: Update Cloudflare Worker identity
  - [ ] SubTask 4.1: Change `name` in `src/kette/wrangler.jsonc` from `florentin-one-mcp` to `kette`
  - [ ] SubTask 4.2: Change `McpServer` name in `src/kette/src/agent/server.ts` from `florentin-one-mcp` to `kette`

- [ ] Task 5: Update CI/CD workflows
  - [ ] SubTask 5.1: Update `workingDirectory` in `.github/workflows/deploy.yml` from `src/florentin-one-mcp` to `src/kette`
  - [ ] SubTask 5.2: Update step name in deploy.yml from "Deploy Florentin One MCP" to "Deploy Kette"
  - [ ] SubTask 5.3: Update GitHub API URL in deploy.yml from `florentin-one-cloud/kette` to `florentin-one-cloud/kette` (if repo is renamed)

- [ ] Task 6: Update vitest configuration
  - [ ] SubTask 6.1: Update all `root` and `extends` paths in `vitest.config.ts` from `./src/florentin-one-mcp` to `./src/kette`

- [ ] Task 7: Update README.md
  - [ ] SubTask 7.1: Replace all `@florentin-one/mcp` references with `@florentin-one/kette`
  - [ ] SubTask 7.2: Replace all `florentin-one-mcp` references with `kette`
  - [ ] SubTask 7.3: Update endpoint URL from `mcp.florentin-one.de` to `kette.florentin-one.de`
  - [ ] SubTask 7.4: Update directory tree from `florentin-one-mcp/` to `kette/`
  - [ ] SubTask 7.5: Update MCP client configuration examples (Cursor, Claude Desktop)
  - [ ] SubTask 7.6: Update Code Mode API import example

- [ ] Task 8: Update AGENTS.md
  - [ ] SubTask 8.1: Replace `@florentin-one/mcp` with `@florentin-one/kette`

- [ ] Task 9: Update CONTRIBUTING.md
  - [ ] SubTask 9.1: Replace all `florentin-one-mcp` directory references with `kette`
  - [ ] SubTask 9.2: Replace `@florentin-one/mcp` with `@florentin-one/kette`
  - [ ] SubTask 9.3: Update clone URL if repo is renamed

- [ ] Task 10: Update MCP client configuration (`.trae/mcp.json`)
  - [ ] SubTask 10.1: Update endpoint URL from `mcp.beta.lstr.one` to `kette.beta.lstr.one`

- [ ] Task 11: Update compliance rules (`.trae/rules/30-compliance.md`)
  - [ ] SubTask 11.1: Update endpoint URL from `mcp.beta.lstr.one` to `kette.beta.lstr.one`

- [ ] Task 12: Update test files
  - [ ] SubTask 12.1: Update `PRODUCTION_URL` in `src/kette/__tests__/e2e/smoke.test.ts` from `florentin-one-mcp.florentin-one.workers.dev` to `kette.florentin-one.workers.dev`
  - [ ] SubTask 12.2: Update `serverInfo.name` assertion in smoke test from `florentin-one-mcp` to `kette`

- [ ] Task 13: Update test templates
  - [ ] SubTask 13.1: Update header comments in `templates/unit.test.ts`, `templates/integration.test.ts`, `templates/e2e.test.ts` from `@florentin-one/mcp` to `@florentin-one/kette`
  - [ ] SubTask 13.2: Update `templates/README.md` references

- [ ] Task 14: Update documentation files
  - [ ] SubTask 14.1: Update `docs/testing-framework.md` — all `florentin-one-mcp` path references to `kette`
  - [ ] SubTask 14.2: Update `docs/testing-framework.md` — endpoint URL references

- [ ] Task 15: Update skill manifests
  - [ ] SubTask 15.1: Update `.trae/skills/mcp-tool-ideation/SKILL.md` — all `florentin-one-mcp` references to `kette`

- [ ] Task 16: Create comprehensive HTAD-aligned documentation
  - [ ] SubTask 16.1: Create `docs/kette-ki-wertschoepfungskette.md` — foundational concepts: position in the AI value chain, the 7 reasoning tools as chain links, vertical vs. horizontal AI
  - [ ] SubTask 16.2: Create `docs/kette-strategic-framework.md` — strategic frameworks: HTAD alignment, technological sovereignty, domain-specific AI differentiation, the "Blaupause" transfer concept
  - [ ] SubTask 16.3: Create `docs/kette-operational-methodology.md` — operational methodologies: the LSTR 6-step reasoning chain, MCP 2026-07-28 transport, Cloudflare Workers deployment, GDPR Art. 28 compliance, Edge AI principles
  - [ ] SubTask 16.4: Create `docs/kette-use-cases.md` — functional use cases across DACH regulated domains: Maschinenbau, Medizintechnik, Chemie/Cleantech, Agrarwirtschaft, IKT — each mapped to specific BMFTR directive requirements
  - [ ] SubTask 16.5: Create `docs/kette-philosophy.md` — guiding philosophies: augmentation over automation, systems over tools, outcome over output, responsibility is operational, problem-first approach
  - [ ] SubTask 16.6: Create `docs/kette-ethics.md` — formal ethical standards: EU AI Act compliance (Art. 5 prohibited practices), WeMake ethics guidelines (human and environment before profit, equal opportunity, transparency), GDPR data sovereignty, human-in-the-loop for critical decisions
  - [ ] SubTask 16.7: Update `README.md` to reference and link all new documentation files

- [ ] Task 17: Regenerate lockfile and verify build
  - [ ] SubTask 17.1: Run `pnpm install` to regenerate `pnpm-lock.yaml` with updated paths
  - [ ] SubTask 17.2: Run `pnpm run build-all` to verify build succeeds
  - [ ] SubTask 17.3: Run `pnpm run check` to verify type checking passes
  - [ ] SubTask 17.4: Run `pnpm run test:all` to verify all tests pass

# Task Dependencies

- [Task 2] depends on [Task 1] (directory must exist before editing package.json)
- [Task 4] depends on [Task 1] (directory must exist before editing wrangler.jsonc and server.ts)
- [Task 6] depends on [Task 1] (directory must exist before updating vitest paths)
- [Task 12] depends on [Task 1] (directory must exist before editing test files)
- [Task 17] depends on [Tasks 1-16] (all changes must be complete before verification)
- [Tasks 3, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16] can run in parallel after [Task 1]
