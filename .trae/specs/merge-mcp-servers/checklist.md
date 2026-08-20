# Checklist

## Package Structure
- [ ] `src/florentin-one-mcp/` directory exists with all subdirectories
- [ ] `src/florentin-one-mcp/package.json` declares `@florentin-one/mcp` at version `1.0.0`
- [ ] `src/florentin-one-mcp/package.json` depends on `agents`, `@modelcontextprotocol/sdk` (latest), `zod`, `chalk`
- [ ] `src/florentin-one-mcp/tsup.config.ts` bundles `src/index.ts` and `src/worker.ts`
- [ ] `src/florentin-one-mcp/vitest.config.ts` exists
- [ ] `src/florentin-one-mcp/wrangler.jsonc` has Durable Object bindings, `nodejs_compat`, EU jurisdiction

## Code Mode API Migration
- [ ] All 7 Code Mode APIs are present in `src/florentin-one-mcp/src/codemode/`
- [ ] All core types are present in `src/florentin-one-mcp/src/core/`
- [ ] Barrel exports at `src/florentin-one-mcp/src/codemode/index.ts` re-export all 7 APIs
- [ ] Barrel exports at `src/florentin-one-mcp/src/core/index.ts` re-export all shared types
- [ ] Zero cross-package imports reference old `src/<tool-name>/` paths

## McpAgent Implementation
- [ ] `FlorentinOneMCP` class extends `McpAgent` from `agents/mcp`
- [ ] `McpServer` instance created in `server` property
- [ ] `init()` method registers all 7 tools via `this.server.tool()`
- [ ] Each tool uses zod schema for input validation
- [ ] Each tool handler calls the correct Code Mode API
- [ ] Metacognitive monitoring prompts registered via `this.server.prompt()`
- [ ] PostHog instrumentation present in each tool handler

## Worker Entry Point
- [ ] `src/florentin-one-mcp/src/worker.ts` exports `FlorentinOneMCP.serve("/mcp", { jurisdiction: "eu" })`
- [ ] `src/florentin-one-mcp/src/index.ts` provides stdio entry point with `StdioServerTransport`
- [ ] `src/index.ts` exports all Code Mode APIs for direct programmatic use

## PostHog Migration
- [ ] `src/florentin-one-mcp/src/lib/posthog.ts` exists with all instrumentation functions
- [ ] `instrumentMcpServer()` is compatible with `McpAgent`'s `McpServer`
- [ ] All tool handlers capture success/failure events

## Workspace Configuration
- [ ] Root `package.json` includes `agents` and `zod` dependencies
- [ ] `@modelcontextprotocol/sdk` updated to latest version
- [ ] `pnpm-workspace.yaml` references `src/florentin-one-mcp`
- [ ] `pnpm-lock.yaml` is valid and up to date

## CI/CD Pipeline
- [ ] `.github/workflows/deploy.yml` deploys single `florentin-one-mcp` worker
- [ ] Build step builds only the unified package
- [ ] Deploy step uses `workingDirectory: src/florentin-one-mcp`
- [ ] No 7-worker matrix strategy remains

## Documentation
- [ ] `README.md` describes unified architecture
- [ ] `README.md` includes single install command (`npm install @florentin-one/mcp`)
- [ ] `README.md` includes MCP client config for Cursor, Claude Desktop, Cloudflare MCP Portals
- [ ] `README.md` includes Code Mode API usage examples
- [ ] `AGENTS.md` reflects unified server in LSTR Solo Harness docs
- [ ] `CONTRIBUTING.md` updated with new package structure

## MCP Tool Ideation Skill
- [ ] `.trae/skills/mcp-tool-ideation/SKILL.md` exists
- [ ] Skill applies RICE scoring model
- [ ] Skill validates against MCP 2026-07-28 spec
- [ ] Skill generates integration plan for new tools

## Deprecation
- [ ] All 7 old `package.json` files have deprecation notice
- [ ] Old `src/<tool-name>/` directories removed from working tree
- [ ] `src/shared/workers-adapter/` directory removed

## Build Verification
- [ ] `pnpm install --frozen-lockfile` exits 0
- [ ] `pnpm run build-all` exits 0
- [ ] `pnpm run check` (typecheck) exits 0
- [ ] `pnpm run test:all` exits 0, all tests pass
- [ ] `pnpm exec wrangler deploy --dry-run` validates wrangler config

## MCP Protocol Compliance
- [ ] Server responds to `tools/list` with all 7 tools
- [ ] Server responds to `tools/call` for each tool correctly
- [ ] Server responds to `prompts/list` with metacognitive monitoring prompts
- [ ] Server uses Streamable HTTP transport (not custom JSON-RPC over HTTP)
- [ ] JSON-RPC 2.0 responses have correct `jsonrpc`, `id`, `result`/`error` fields

## Cloudflare Compatibility
- [ ] Worker deploys successfully to Cloudflare
- [ ] MCP Portal can connect to the deployed Worker endpoint
- [ ] Code Mode (Dynamic Workers) compatible
- [ ] Durable Object hibernation works correctly
- [ ] EU data jurisdiction enforced
