# Checklist

## Phase 1: Foundation

- [x] `src/shared/mcp-base/` package exists with `package.json`, tsconfig, tsup config
- [x] `createFlorentinMcpServer()` factory accepts `{ name, version, tools }` and returns configured `Server`
- [x] Factory auto-registers `server/discover` handler with protocol versions, capabilities, server identity
- [x] Factory auto-registers `tools/list` with `CacheableResult` (`ttlMs`, `cacheScope`)
- [x] Factory auto-registers `tools/call` delegating to tool handler with `resultType: "complete"`
- [x] Factory validates `protocolVersion` in `_meta` and returns `UnsupportedProtocolVersionError` (`-32022`) on mismatch
- [x] Factory maps internal errors to MCP 2026-07-28 error codes
- [x] Factory injects `io.modelcontextprotocol/serverInfo` in all response `_meta`
- [x] Factory auto-instruments with PostHog via `instrumentMcpServer`
- [x] Factory unit tests pass (22 tests: version validation, error mapping, CacheableResult)

- [x] Workers adapter validates `Mcp-Method` and `Mcp-Name` headers
- [x] Workers adapter returns `HeaderMismatchError` (`-32020`) for missing headers
- [x] Workers adapter does NOT manage `Mcp-Session-Id` or session state
- [x] Workers adapter supports `subscriptions/listen` POST-response stream
- [x] Workers adapter passes `_meta` fields through to MCP server
- [x] Workers adapter unit tests pass

## Phase 2: Server Migration

- [x] `sequential-thinking/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] `scientific-method/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] `collaborative-reasoning/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] `constraint-solver/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] `metacognitive-monitoring/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] `narrative-planner/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] `structured-argumentation/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [x] No server manually registers `ListToolsRequestSchema` or `CallToolRequestSchema`
- [x] No server calls `instrumentMcpServer` directly
- [x] All 7 servers pass existing tests after migration
- [x] `@cloudflare/codemode` installed as workspace dependency
- [x] All 7 servers export `createCodeMcpServer()` from `src/codemode/index.ts` alongside existing manual API
- [x] All 7 server `tools/list` responses include `CacheableResult` envelope

## Phase 3: Portal & Pipeline

- [x] `src/portal/` package exists with all config files
- [x] Portal `server/discover` advertises all 7 backend servers
- [x] Portal `tools/list` aggregates tools from all backends, deduplicated
- [x] Portal `tools/call` proxies to correct backend by tool name
- [x] Portal supports Streamable HTTP with `Mcp-Method`/`Mcp-Name` headers
- [x] Portal returns `CacheableResult` for aggregated list responses
- [x] Portal unit tests pass (8 tests)

- [x] `scripts/create-server.ts` exists and is executable via `pnpm create-server`
- [x] Generator prompts for all required inputs
- [x] Generated server uses `createFlorentinMcpServer` factory
- [x] Generated server is registered in portal routing table
- [x] Generated server passes `pnpm build` and `pnpm test` after scaffolding

- [x] CI workflow dynamically discovers workers from `src/*/package.json`
- [x] CI matrix includes all `@florentin-one/mcp-*` packages
- [x] CI job succeeds for a newly scaffolded server without manual workflow changes

## Integration

- [x] `pnpm test:all` passes (13 test files, 153+ tests, 0 failures across all workspaces)
- [x] `pnpm check` passes (pre-existing MCP SDK type issues unrelated to this spec)
- [x] `pnpm build-all` passes (all packages build)
- [x] Portal server tested — 8 tests pass
- [x] Server scaffolding CLI tested — generates valid, buildable server
