# Tasks

## Phase 1: Foundation — Shared Infrastructure

- [ ] Task 1: Create `src/shared/mcp-base/` shared MCP server factory package
  - [ ] Create `package.json` with dependencies on `@modelcontextprotocol/sdk`, `@cloudflare/codemode`, `posthog-node`
  - [ ] Implement `createFlorentinMcpServer(options)` factory function
  - [ ] Auto-register `server/discover` handler per MCP 2026-07-28 spec
  - [ ] Auto-register `ListToolsRequestSchema` with `CacheableResult` envelope
  - [ ] Auto-register `CallToolRequestSchema` delegating to tool-specific handler
  - [ ] Inject `resultType: "complete"` into all tool call responses
  - [ ] Inject `_meta.io.modelcontextprotocol/serverInfo` into all responses
  - [ ] Validate `_meta.io.modelcontextprotocol/protocolVersion` on each request
  - [ ] Return `UnsupportedProtocolVersionError` (`-32022`) for version mismatches
  - [ ] Map internal errors to MCP 2026-07-28 error codes
  - [ ] Auto-instrument with PostHog (call `instrumentMcpServer` and expose hook for tool events)
  - [ ] Write unit tests for factory, protocol version validation, error mapping

- [ ] Task 2: Update `src/shared/workers-adapter/` for MCP 2026-07-28 Streamable HTTP
  - [ ] Remove `Mcp-Session-Id` handling and session state management
  - [ ] Add `Mcp-Method` and `Mcp-Name` header validation on POST requests
  - [ ] Return `HeaderMismatchError` (`-32020`) for missing required headers
  - [ ] Pass `_meta` from request body through to MCP server
  - [ ] Add `subscriptions/listen` POST-response stream support
  - [ ] Write unit tests for header validation, error cases, `_meta` passthrough

## Phase 2: Server Migration

- [ ] Task 3: Migrate `sequential-thinking` to shared factory
  - [ ] Replace `new Server(...)` with `createFlorentinMcpServer(...)` in `src/mcp/server.ts`
  - [ ] Remove manual `ListToolsRequestSchema`/`CallToolRequestSchema` registration
  - [ ] Remove inline PostHog capture logic (delegate to factory hooks)
  - [ ] Keep `src/core/` and `src/codemode/` unchanged
  - [ ] Verify all existing tests pass; update test imports if needed

- [ ] Task 4: Migrate `scientific-method` to shared factory
  - [ ] Same migration pattern as Task 3

- [ ] Task 5: Migrate `collaborative-reasoning` to shared factory
  - [ ] Same migration pattern as Task 3

- [ ] Task 6: Migrate `constraint-solver` to shared factory
  - [ ] Same migration pattern as Task 3

- [ ] Task 7: Migrate `metacognitive-monitoring` to shared factory
  - [ ] Same migration pattern as Task 3

- [ ] Task 8: Migrate `narrative-planner` to shared factory
  - [ ] Same migration pattern as Task 3

- [ ] Task 9: Migrate `structured-argumentation` to shared factory
  - [ ] Same migration pattern as Task 3

- [ ] Task 10: Add `@cloudflare/codemode` integration to all 7 servers
  - [ ] Add `@cloudflare/codemode` and `@cloudflare/codemode/mcp` as workspace dependencies
  - [ ] Add `codeMcpServer()` export to each server's `src/codemode/index.ts` alongside existing manual API
  - [ ] Verify Code Mode sandbox can import and call typed methods

## Phase 3: Portal & Pipeline

- [ ] Task 11: Create `src/portal/` MCP portal/gateway server
  - [ ] Create `package.json`, `tsconfig.json`, `tsup.config.ts`, `wrangler.jsonc`, `vitest.config.ts`
  - [ ] Implement `server/discover` advertising all backend servers
  - [ ] Implement `tools/list` aggregation from all backend workers
  - [ ] Implement `tools/call` proxy routing by tool name
  - [ ] Support Streamable HTTP with `Mcp-Method`/`Mcp-Name` headers
  - [ ] Return `CacheableResult` for aggregated list responses
  - [ ] Write tests for aggregation deduplication, proxy routing, error forwarding

- [ ] Task 12: Create `scripts/create-server.ts` scaffolding CLI
  - [ ] Implement interactive prompts for server name, description, tool name
  - [ ] Generate complete file tree from templates
  - [ ] Templates use `createFlorentinMcpServer` factory
  - [ ] Auto-register new server in portal routing table
  - [ ] Output post-scaffold instructions

- [ ] Task 13: Update CI/CD workflow for dynamic matrix
  - [ ] Replace hardcoded `matrix.worker` list with dynamic discovery step
  - [ ] Discovery: scan `src/*/package.json` for `@florentin-one/mcp-` prefix packages
  - [ ] Output the discovered worker list as JSON for `fromJson` matrix
  - [ ] Test CI pipeline locally with `act` or dry-run

- [ ] Task 14: Integration testing & final validation
  - [ ] Run `pnpm test:all` — all workspace test suites pass
  - [ ] Run `pnpm check` — no TypeScript errors
  - [ ] Run `pnpm build-all` — all packages build successfully
  - [ ] Deploy one server (sequential-thinking) to staging and verify MCP 2026-07-28 protocol compliance
  - [ ] Verify portal aggregates and routes correctly in staging

# Task Dependencies

- Tasks 3–9 depend on Task 1 (shared factory) and Task 2 (workers adapter)
- Task 10 depends on Tasks 3–9 (servers must be migrated before Code Mode SDK integration)
- Task 11 (portal) depends on Task 1 and Task 2 (infrastructure)
- Task 12 (CLI) depends on Task 1 (templates use factory)
- Task 13 (CI) can run in parallel with Phase 1–3; depends on Tasks 3–9 completing at minimum
- Task 14 (integration test) depends on Tasks 1–13

Tasks 3–9 are fully parallelizable with each other. Task 10 can be parallelized across all 7 servers.
