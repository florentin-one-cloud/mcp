# Standardize MCP Pipeline Spec

## Why

The Florentin One MCP monorepo contains 7 reasoning/cognition servers built on a shared but informal pattern. Each
server duplicates boilerplate for MCP server creation, worker adapters, tool registration, and Code Mode APIs. The MCP
protocol has undergone a major revision (2025-11-25 → 2026-07-28) introducing stateless operation, `server/discover`,
`resultType`, `CacheableResult`, MRTR, and new error codes. Simultaneously, Cloudflare has shipped
`@cloudflare/codemode` as a first-class SDK for MCP tool exposure via code execution. This spec standardizes,
streamlines, and automates the entire pipeline from server creation through MCP portal aggregation and CI/CD deployment.

## What Changes

- **NEW** `src/shared/mcp-base/` — shared MCP server factory implementing 2026-07-28 protocol compliance
- **NEW** `src/portal/` — MCP portal server aggregating all reasoning servers with `server/discover`
- **NEW** `scripts/create-server.ts` — interactive CLI to scaffold a new MCP server
- **MODIFIED** All 7 existing servers — migrate to shared `mcp-base` factory, 2026-07-28 protocol,
  `@cloudflare/codemode`
- **MODIFIED** CI/CD — dynamic worker matrix discovery; auto-deploy for new servers
- **MODIFIED** `workers-adapter` — update for stateless Streamable HTTP with `Mcp-Method`/`Mcp-Name` headers
- **BREAKING** Drop `initialize`/`notifications/initialized` handshake; all requests carry `_meta` protocol version
- **BREAKING** All results MUST include `resultType: "complete"` (or `"input_required"` for MRTR)
- **BREAKING** Error codes renumbered per MCP 2026-07-28 spec

## Impact

- Affected specs: N/A (new spec)
- Affected code:
  - `src/shared/workers-adapter/index.ts`
  - `src/shared/posthog/index.ts`
  - All 7 server packages (`src/*/`)
  - `.github/workflows/deploy.yml`
  - Root `package.json`
  - New: `src/shared/mcp-base/`, `src/portal/`, `scripts/create-server.ts`

## ADDED Requirements

### Requirement: Shared MCP Base Factory

The system SHALL provide `src/shared/mcp-base/` — a factory function `createFlorentinMcpServer(options)` that returns a
fully configured, MCP 2026-07-28 compliant `Server` instance.

The factory SHALL:

- Accept `{ name, version, tools }` options
- Auto-register `server/discover` advertising protocol versions, capabilities, and server identity
- Auto-register `ListToolsRequestSchema` returning tools with `CacheableResult` envelope including `ttlMs` and
  `cacheScope`
- Auto-inject `resultType: "complete"` into all tool call results
- Map internal errors to MCP 2026-07-28 error codes (`-32020`–`-32099` range)
- Accept `_meta` fields (`io.modelcontextprotocol/protocolVersion`, `io.modelcontextprotocol/clientCapabilities`) on
  every request
- Return `io.modelcontextprotocol/serverInfo` in every response `_meta`
- Return `UnsupportedProtocolVersionError` (`-32022`) for version mismatches
- Auto-instrument with PostHog analytics
- Reject requests missing `protocolVersion` in `_meta`

#### Scenario: Create server with factory

- **WHEN** a developer calls `createFlorentinMcpServer({ name: "sequential-thinking", version: "1.0.0", tools: [...] })`
- **THEN** a Server is returned with `server/discover`, `tools/list`, and `tools/call` handlers pre-registered

#### Scenario: Stateless request handling

- **WHEN** a client sends `tools/call` with `_meta.io.modelcontextprotocol/protocolVersion: "2026-07-28"`
- **THEN** the server processes the request without session state
- **AND** the response `_meta` contains `io.modelcontextprotocol/serverInfo`

#### Scenario: Protocol version mismatch

- **WHEN** a client sends a request with unsupported `protocolVersion`
- **THEN** the server returns `UnsupportedProtocolVersionError` (code `-32022`)

### Requirement: MCP 2026-07-28 Protocol Compliance

All MCP servers in the monorepo SHALL comply with the MCP 2026-07-28 specification.

Each server SHALL:

- NOT require `initialize`/`notifications/initialized` handshake
- NOT use `Mcp-Session-Id` header
- Implement `server/discover` RPC
- Accept `_meta` fields on every request
- Include `resultType` in all responses
- Return `CacheableResult` (`ttlMs`, `cacheScope`) on list endpoints
- Use updated error codes (`-32020` HeaderMismatch, `-32022` UnsupportedProtocolVersion)
- Support `subscriptions/listen` for server-to-client notifications
- NOT implement deprecated features (Roots, Sampling, Logging via `logging/setLevel`)

#### Scenario: tools/list returns CacheableResult

- **WHEN** client calls `tools/list`
- **THEN** response includes `resultType: "complete"`, `ttlMs`, and `cacheScope: "public"`

#### Scenario: tool call returns resultType

- **WHEN** client calls `tools/call`
- **THEN** response includes `resultType: "complete"`

### Requirement: Code Mode SDK Integration

All MCP servers SHALL expose their tools through `@cloudflare/codemode` in addition to the standard MCP transport.

Each server's `src/codemode/index.ts` SHALL:

- Export a typed TypeScript class exposing server capabilities as methods
- Use `@cloudflare/codemode/mcp` `codeMcpServer()` for MCP-tool-to-Code-Mode bridging where applicable
- Maintain the existing manual Code Mode API for backward compatibility
- Be importable by the Durable Object Code Mode runtime

#### Scenario: Code Mode API exposes typed methods

- **WHEN** LLM writes code importing `SequentialThinking` from `@florentin-one/mcp-sequential-thinking`
- **THEN** all methods are fully typed with JSDoc descriptions derived from tool schemas

#### Scenario: MCP bridge via codeMcpServer

- **WHEN** a Code Mode runtime wraps an MCP server with `codeMcpServer()`
- **THEN** the server's tools are exposed as typed TypeScript methods in the sandbox

### Requirement: MCP Portal Server

The system SHALL include `src/portal/` — a Cloudflare Worker that acts as a centralized MCP gateway.

The portal SHALL:

- Implement `server/discover` advertising all 7 reasoning servers as discoverable capabilities
- Proxy `tools/list` and `tools/call` to individual backend MCP servers
- Support Streamable HTTP transport with `Mcp-Method` and `Mcp-Name` headers
- Serve at the existing endpoint `https://mcp.florentin-one.de/mcp`
- Aggregate `tools/list` from all backend servers into a unified tool catalog
- Route `tools/call` to the correct backend based on tool name prefix or routing table
- Return `CacheableResult` with appropriate `ttlMs` for aggregated list responses

#### Scenario: Portal aggregates tool lists

- **WHEN** client calls `tools/list` on the portal
- **THEN** response contains all tools from all 7 backend servers, deduplicated

#### Scenario: Portal routes tool call

- **WHEN** client calls `tools/call` with `name: "sequentialthinking"`
- **THEN** portal proxies the call to the sequential-thinking worker and returns its response

### Requirement: Server Generator CLI

The system SHALL include `scripts/create-server.ts` — a script that scaffolds a new Florentin One MCP server.

The generator SHALL:

- Prompt for server name (kebab-case), description, and tool name (camelCase)
- Generate the complete file tree under `src/<name>/`:
  - `package.json` with `@florentin-one/mcp-<name>` naming, correct dependencies, scripts
  - `tsconfig.json` extending shared conventions
  - `tsup.config.ts` for dual-entry build
  - `wrangler.jsonc` with service name, observability, cache settings
  - `vitest.config.ts`
  - `src/index.ts` (stdio entrypoint)
  - `src/worker.ts` (Cloudflare Worker entrypoint)
  - `src/mcp/server.ts` (uses `createFlorentinMcpServer`)
  - `src/mcp/tools.ts` (tool definition template)
  - `src/core/types.ts` (domain types)
  - `src/core/logic.ts` (business logic template)
  - `src/codemode/index.ts` (typed Code Mode API)
  - `tests/core/logic.test.ts` (test template)
  - `.npmignore`, `LICENSE`, `README.md`
- Register the new server in the portal routing table
- Output instructions for adding Cloudflare secrets and triggering CI deployment

#### Scenario: Scaffold new server

- **WHEN** developer runs `pnpm create-server` and enters "my-reasoning" / "My Reasoning Tool" / "myReasoning"
- **THEN** `src/my-reasoning/` is created with all files, ready for `pnpm install && pnpm build`

### Requirement: Dynamic CI/CD Worker Matrix

The deploy workflow SHALL dynamically discover MCP server packages instead of using a hardcoded matrix.

The CI pipeline SHALL:

- Scan `src/*/package.json` for packages with `@florentin-one/mcp-` prefix
- Generate the deploy matrix from discovered packages
- Deploy each discovered worker via `cloudflare/wrangler-action@v4`
- Fail if any worker's build, type-check, or test fails

#### Scenario: New server auto-deployed

- **WHEN** a new server package is added to `src/`
- **THEN** CI automatically includes it in the deploy matrix without manual workflow edits

### Requirement: Workers Adapter Update

The shared `workers-adapter` SHALL be updated for MCP 2026-07-28 Streamable HTTP compliance.

The adapter SHALL:

- Validate `Mcp-Method` and `Mcp-Name` headers on POST requests
- NOT manage session state or `Mcp-Session-Id`
- Support `subscriptions/listen` as a long-lived POST-response stream
- Return `HeaderMismatchError` (`-32020`) for missing required headers
- Pass `_meta` fields through to the MCP server layer

#### Scenario: Request with valid headers

- **WHEN** POST request includes `Mcp-Method: tools/call` and `Mcp-Name: sequential-thinking`
- **THEN** adapter routes to MCP server with `_meta` context intact

#### Scenario: Request missing required headers

- **WHEN** POST request omits `Mcp-Method` header
- **THEN** adapter returns `HeaderMismatchError` with code `-32020`

## MODIFIED Requirements

### Requirement: Existing Server Migration

All 7 existing MCP servers SHALL be migrated to use the shared `createFlorentinMcpServer` factory and 2026-07-28
protocol.

Each server migration SHALL:

- Replace manual `new Server(...)` with `createFlorentinMcpServer(...)`
- Remove `ListToolsRequestSchema` and `CallToolRequestSchema` manual registration
- Remove `instrumentMcpServer` call (now handled by factory)
- Remove PostHog event capture logic from `CallToolRequestSchema` handler (moved to factory hooks)
- Keep `src/core/` business logic unchanged
- Keep `src/codemode/index.ts` Code Mode API unchanged (additive `@cloudflare/codemode` integration only)
- Update `src/mcp/tools.ts` to include `CacheableResult` metadata if absent
- Remove any `initialize` or session-related code

#### Scenario: Migrated server handles tool call

- **WHEN** client sends `tools/call` for `sequentialthinking` on migrated server
- **THEN** server processes identically to pre-migration behavior
- **AND** response includes `resultType: "complete"` and `_meta` server info

## REMOVED Requirements

### Requirement: Manual Server Initialization

**Reason**: Replaced by `createFlorentinMcpServer` factory. **Migration**: Replace `new Server(...)` calls with factory;
remove manual request handler registration for standard MCP methods.

### Requirement: Session-Based MCP Transport

**Reason**: MCP 2026-07-28 removes protocol-level sessions. **Migration**: Remove `Mcp-Session-Id` handling; remove
`initialize`/`notifications/initialized` handshake from all transports.

### Requirement: Hardcoded CI Worker Matrix

**Reason**: Replaced by dynamic package discovery. **Migration**: CI workflow scans `src/*/package.json` to build deploy
matrix.
