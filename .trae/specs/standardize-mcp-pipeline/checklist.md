# Checklist

## Phase 1: Foundation

- [ ] `src/shared/mcp-base/` package exists with `package.json`, tsconfig, tsup config
- [ ] `createFlorentinMcpServer()` factory accepts `{ name, version, tools }` and returns configured `Server`
- [ ] Factory auto-registers `server/discover` handler with protocol versions, capabilities, server identity
- [ ] Factory auto-registers `tools/list` with `CacheableResult` (`ttlMs`, `cacheScope`)
- [ ] Factory auto-registers `tools/call` delegating to tool handler with `resultType: "complete"`
- [ ] Factory validates `protocolVersion` in `_meta` and returns `UnsupportedProtocolVersionError` (`-32022`) on
      mismatch
- [ ] Factory maps internal errors to MCP 2026-07-28 error codes
- [ ] Factory injects `io.modelcontextprotocol/serverInfo` in all response `_meta`
- [ ] Factory auto-instruments with PostHog via `instrumentMcpServer`
- [ ] Factory unit tests pass (version validation, error mapping, CacheableResult)

- [ ] Workers adapter validates `Mcp-Method` and `Mcp-Name` headers
- [ ] Workers adapter returns `HeaderMismatchError` (`-32020`) for missing headers
- [ ] Workers adapter does NOT manage `Mcp-Session-Id` or session state
- [ ] Workers adapter supports `subscriptions/listen` POST-response stream
- [ ] Workers adapter passes `_meta` fields through to MCP server
- [ ] Workers adapter unit tests pass

## Phase 2: Server Migration

- [ ] `sequential-thinking/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] `scientific-method/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] `collaborative-reasoning/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] `constraint-solver/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] `metacognitive-monitoring/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] `narrative-planner/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] `structured-argumentation/src/mcp/server.ts` uses `createFlorentinMcpServer` factory
- [ ] No server manually registers `ListToolsRequestSchema` or `CallToolRequestSchema`
- [ ] No server calls `instrumentMcpServer` directly
- [ ] All 7 servers pass existing tests after migration
- [ ] All 7 servers have `@cloudflare/codemode` and `@cloudflare/codemode/mcp` as dependencies
- [ ] All 7 servers export `codeMcpServer()` from `src/codemode/index.ts` alongside existing manual API
- [ ] All 7 server `tools/list` responses include `CacheableResult` envelope

## Phase 3: Portal & Pipeline

- [ ] `src/portal/` package exists with all config files
- [ ] Portal `server/discover` advertises all 7 backend servers
- [ ] Portal `tools/list` aggregates tools from all backends, deduplicated
- [ ] Portal `tools/call` proxies to correct backend by tool name
- [ ] Portal supports Streamable HTTP with `Mcp-Method`/`Mcp-Name` headers
- [ ] Portal returns `CacheableResult` for aggregated list responses
- [ ] Portal unit tests pass

- [ ] `scripts/create-server.ts` exists and is executable via `pnpm create-server`
- [ ] Generator prompts for all required inputs
- [ ] Generated server uses `createFlorentinMcpServer` factory
- [ ] Generated server is registered in portal routing table
- [ ] Generated server passes `pnpm build` and `pnpm test` after scaffolding

- [ ] CI workflow dynamically discovers workers from `src/*/package.json`
- [ ] CI matrix includes all `@florentin-one/mcp-*` packages
- [ ] CI job succeeds for a newly scaffolded server without manual workflow changes

## Integration

- [ ] `pnpm test:all` passes (all workspace test suites)
- [ ] `pnpm check` passes (no TypeScript errors)
- [ ] `pnpm build-all` passes (all packages build)
- [ ] At least one server deployed to staging and verified for MCP 2026-07-28 protocol compliance
- [ ] Portal deployed to staging and verified for tool aggregation and routing
