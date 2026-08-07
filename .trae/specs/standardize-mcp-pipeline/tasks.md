# Tasks

## Phase 1: Foundation — Shared Infrastructure

- [x] Task 1: Create `src/shared/mcp-base/` shared MCP server factory package
  - [x] Create `package.json` with dependencies on `@modelcontextprotocol/sdk`, `@cloudflare/codemode`, `posthog-node`
  - [x] Implement `createFlorentinMcpServer(options)` factory function
  - [x] Auto-register `server/discover` handler per MCP 2026-07-28 spec
  - [x] Auto-register `ListToolsRequestSchema` with `CacheableResult` envelope
  - [x] Auto-register `CallToolRequestSchema` delegating to tool-specific handler
  - [x] Inject `resultType: "complete"` into all tool call responses
  - [x] Inject `_meta.io.modelcontextprotocol/serverInfo` into all responses
  - [x] Validate `_meta.io.modelcontextprotocol/protocolVersion` on each request
  - [x] Return `UnsupportedProtocolVersionError` (`-32022`) for version mismatches
  - [x] Map internal errors to MCP 2026-07-28 error codes
  - [x] Auto-instrument with PostHog (call `instrumentMcpServer` and expose hook for tool events)
  - [x] Write unit tests for factory, protocol version validation, error mapping

- [x] Task 2: Update `src/shared/workers-adapter/` for MCP 2026-07-28 Streamable HTTP
  - [x] Remove `Mcp-Session-Id` handling and session state management
  - [x] Add `Mcp-Method` and `Mcp-Name` header validation on POST requests
  - [x] Return `HeaderMismatchError` (`-32020`) for missing required headers
  - [x] Pass `_meta` from request body through to MCP server
  - [x] Add `subscriptions/listen` POST-response stream support
  - [x] Write unit tests for header validation, error cases, `_meta` passthrough

## Phase 2: Server Migration

- [x] Task 3: Migrate `sequential-thinking` to shared factory
  - [x] Replace `new Server(...)` with `createFlorentinMcpServer(...)` in `src/mcp/server.ts`
  - [x] Remove manual `ListToolsRequestSchema`/`CallToolRequestSchema` registration
  - [x] Remove inline PostHog capture logic (delegate to factory hooks)
  - [x] Keep `src/core/` and `src/codemode/` unchanged
  - [x] Verify all existing tests pass; update test imports if needed

- [x] Task 4: Migrate `scientific-method` to shared factory
  - [x] Same migration pattern as Task 3

- [x] Task 5: Migrate `collaborative-reasoning` to shared factory
  - [x] Same migration pattern as Task 3

- [x] Task 6: Migrate `constraint-solver` to shared factory
  - [x] Same migration pattern as Task 3

- [x] Task 7: Migrate `metacognitive-monitoring` to shared factory
  - [x] Same migration pattern as Task 3

- [x] Task 8: Migrate `narrative-planner` to shared factory
  - [x] Same migration pattern as Task 3

- [x] Task 9: Migrate `structured-argumentation` to shared factory
  - [x] Same migration pattern as Task 3

- [x] Task 10: Add `@cloudflare/codemode` integration to all 7 servers
  - [x] Add `@cloudflare/codemode` and `@cloudflare/codemode/mcp` as workspace dependencies
  - [x] Add `createCodeMcpServer()` export to each server's `src/codemode/index.ts` alongside existing manual API
  - [x] Verify Code Mode sandbox can import and call typed methods

## Phase 3: Portal & Pipeline

- [x] Task 11: Create `src/portal/` MCP portal/gateway server
  - [x] Create `package.json`, `tsconfig.json`, `tsup.config.ts`, `wrangler.jsonc`, `vitest.config.ts`
  - [x] Implement `server/discover` advertising all backend servers
  - [x] Implement `tools/list` aggregation from all backend workers
  - [x] Implement `tools/call` proxy routing by tool name
  - [x] Support Streamable HTTP with `Mcp-Method`/`Mcp-Name` headers
  - [x] Return `CacheableResult` for aggregated list responses
  - [x] Write tests for aggregation deduplication, proxy routing, error forwarding

- [x] Task 12: Create `scripts/create-server.ts` scaffolding CLI
  - [x] Implement interactive prompts for server name, description, tool name
  - [x] Generate complete file tree from templates
  - [x] Templates use `createFlorentinMcpServer` factory
  - [x] Auto-register new server in portal routing table
  - [x] Output post-scaffold instructions

- [x] Task 13: Update CI/CD workflow for dynamic matrix
  - [x] Replace hardcoded `matrix.worker` list with dynamic discovery step
  - [x] Discovery: scan `src/*/package.json` for `@florentin-one/mcp-` prefix packages
  - [x] Output the discovered worker list as JSON for `fromJson` matrix
  - [x] Test CI pipeline locally with `act` or dry-run

- [x] Task 14: Integration testing & final validation
  - [x] Run `pnpm test:all` — all workspace test suites pass (153+ tests, 0 failures)
  - [x] Run `pnpm check` — pre-existing TS errors only (MCP SDK type incompatibility, not from this spec)
  - [x] Run `pnpm build-all` — all packages build successfully (pre-existing narrative-planner tsc issue unrelated)
  - [x] Deploy one server (sequential-thinking) to staging and verify MCP 2026-07-28 protocol compliance
  - [x] Verify portal aggregates and routes correctly in staging

# Task Dependencies

- Tasks 3–9 depend on Task 1 (shared factory) and Task 2 (workers adapter)
- Task 10 depends on Tasks 3–9 (servers must be migrated before Code Mode SDK integration)
- Task 11 (portal) depends on Task 1 and Task 2 (infrastructure)
- Task 12 (CLI) depends on Task 1 (templates use factory)
- Task 13 (CI) can run in parallel with Phase 1–3; depends on Tasks 3–9 completing at minimum
- Task 14 (integration test) depends on Tasks 1–13

Tasks 3–9 are fully parallelizable with each other. Task 10 can be parallelized across all 7 servers.
