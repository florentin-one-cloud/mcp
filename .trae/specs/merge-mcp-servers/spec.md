# Merge All MCP Tools into One Unified MCP Server Spec

## Why

The current architecture deploys 7 independent MCP servers (each exposing exactly one tool) as 7 separate Cloudflare Workers. This fragments the tool catalog, multiplies cold-start latency, complicates client configuration, and violates the MCP 2026-07-28 specification's Streamable HTTP transport model. Consolidating into a single `McpAgent`-based server reduces operational overhead, enables atomic tool discovery, aligns with the Cloudflare Agents SDK `McpAgent` pattern, and provides a foundation for stateful MCP sessions with Durable Objects.

## What Changes

- **Merge all 7 tool definitions** into a single `McpAgent` subclass (`FlorentinOneMCP`) using `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js` (**BREAKING**)
- **Replace 7 Cloudflare Workers** with 1 unified Worker using `McpAgent.serve()` for Streamable HTTP transport (**BREAKING**)
- **Upgrade `@modelcontextprotocol/sdk`** from `1.26.0` to the latest version supporting the 2026-07-28 specification
- **Adopt `McpAgent`** from `agents/mcp` (Cloudflare Agents SDK) as the server base class, replacing the custom `Server` + `workers-adapter` pattern
- **Replace custom HTTP-to-MCP adapter** (`src/shared/workers-adapter/`) with `McpAgent.serve()` built-in Streamable HTTP transport
- **Add `agents` SDK dependency** and `zod` for tool input validation (required by `McpServer.tool()`)
- **Restructure monorepo**: single `src/florentin-one-mcp/` package replacing 7 `src/<tool-name>/` packages
- **Preserve Code Mode APIs** as exported modules within the unified package for direct programmatic use
- **Update CI/CD**: single Worker deploy replacing the 7-worker matrix strategy
- **Update all documentation** (README.md, AGENTS.md, CONTRIBUTING.md) for the unified architecture
- **Deprecate 7 individual npm packages** (`@florentin-one/mcp-*`) in favor of `@florentin-one/mcp` (unified)
- **Add RICE-scored tool ideation skill** via `create-skill` for future MCP tool validation and integration

## Impact

- Affected specs: N/A (new spec)
- Affected code:
  - **NEW**: `src/florentin-one-mcp/` — unified MCP server package
  - **NEW**: `src/florentin-one-mcp/src/agent.ts` — `FlorentinOneMCP` class extending `McpAgent`
  - **NEW**: `src/florentin-one-mcp/src/tools/` — all 7 tool definitions migrated
  - **NEW**: `src/florentin-one-mcp/src/codemode/` — preserved Code Mode APIs
  - **NEW**: `src/florentin-one-mcp/src/core/` — shared types
  - **MODIFIED**: Root `package.json` — workspace updated, new dependencies
  - **MODIFIED**: `.github/workflows/deploy.yml` — single worker deploy
  - **MODIFIED**: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`
  - **REMOVED**: `src/collaborative-reasoning/`, `src/constraint-solver/`, `src/metacognitive-monitoring/`, `src/narrative-planner/`, `src/scientific-method/`, `src/sequential-thinking/`, `src/structured-argumentation/`
  - **REMOVED**: `src/shared/workers-adapter/` (replaced by `McpAgent.serve()`)
  - **PRESERVED**: `src/shared/posthog/` (migrated to unified package)

## ADDED Requirements

### Requirement: Unified McpAgent Server

The system SHALL provide a single `FlorentinOneMCP` class extending `McpAgent` from `agents/mcp` that registers all 7 reasoning tools via `McpServer` and exposes them through Streamable HTTP transport.

#### Scenario: Tool discovery

- **WHEN** an MCP client sends `tools/list`
- **THEN** the server returns all 7 tools: `metacognitiveMonitoring`, `sequentialthinking`, `collaborativeReasoning`, `scientificMethod`, `structuredArgumentation`, `constraintSolver`, `narrativePlanner`

#### Scenario: Tool invocation

- **WHEN** an MCP client sends `tools/call` with any of the 7 tool names
- **THEN** the server routes to the correct Code Mode handler and returns the result

#### Scenario: Streamable HTTP transport

- **WHEN** the Worker receives an HTTP request at the configured path
- **THEN** `McpAgent.serve()` handles Streamable HTTP transport per MCP 2026-07-28 specification

### Requirement: MCP 2026-07-28 Specification Compliance

The system SHALL use `@modelcontextprotocol/sdk` at a version that implements the 2026-07-28 specification, including Streamable HTTP transport, proper JSON-RPC 2.0 message format, and capability negotiation.

#### Scenario: Protocol version negotiation

- **WHEN** client and server initialize
- **THEN** they negotiate protocol version `2026-07-28`

#### Scenario: JSON-RPC compliance

- **WHEN** any request is received
- **THEN** responses conform to JSON-RPC 2.0 with proper `jsonrpc`, `id`, and `result`/`error` fields

### Requirement: Cloudflare Agents SDK Integration

The system SHALL use `McpAgent` from `agents/mcp` as the server base class, providing Durable Object-backed state, hibernation support, and EU data jurisdiction for GDPR compliance.

#### Scenario: EU data jurisdiction

- **WHEN** `McpAgent.serve()` is called with `{ jurisdiction: "eu" }`
- **THEN** all MCP session data, state, and processing remain within EU data centers

#### Scenario: Hibernation

- **WHEN** the MCP server has no active connections
- **THEN** the Durable Object hibernates, preserving state while consuming zero compute

### Requirement: Preserved Code Mode APIs

The system SHALL preserve all 7 Code Mode APIs as exported modules within the unified package, enabling direct programmatic use without MCP protocol overhead.

#### Scenario: Direct API usage

- **WHEN** a developer imports `SequentialThinking` from `@florentin-one/mcp`
- **THEN** they can instantiate and use it directly without an MCP transport

### Requirement: Zod Input Validation

All tool input schemas SHALL use `zod` for validation, as required by `McpServer.tool()`, replacing the current JSON Schema `inputSchema` definitions.

#### Scenario: Invalid tool input

- **WHEN** a tool is called with invalid arguments
- **THEN** zod validation rejects the call with a descriptive error before the handler executes

### Requirement: Single Cloudflare Worker Deployment

The system SHALL deploy as a single Cloudflare Worker using `wrangler deploy`, replacing the current 7-worker matrix deployment.

#### Scenario: Deploy on push to main

- **WHEN** code is pushed to `main`
- **THEN** a single Worker is built and deployed via `cloudflare/wrangler-action@v4`

### Requirement: Unified npm Package

The system SHALL publish a single `@florentin-one/mcp` package to npm, deprecating the 7 individual `@florentin-one/mcp-*` packages.

#### Scenario: Install unified package

- **WHEN** a user runs `npm install @florentin-one/mcp`
- **THEN** all 7 tools are available through a single import

### Requirement: RICE-Scored Tool Ideation Skill

The system SHALL include a TRAE IDE skill (`mcp-tool-ideation`) that applies RICE scoring (Reach, Impact, Confidence, Effort) to evaluate new MCP tool proposals before implementation.

#### Scenario: Propose new tool

- **WHEN** a developer invokes the `mcp-tool-ideation` skill with a tool proposal
- **THEN** the skill returns a RICE score, feasibility assessment, and integration plan

### Requirement: Comprehensive Documentation

The system SHALL provide updated documentation covering: unified architecture, tool catalog, Cloudflare deployment, MCP client configuration (Cursor, Claude Desktop, Cloudflare MCP Portals), and Code Mode API usage.

#### Scenario: Developer onboarding

- **WHEN** a new developer reads README.md
- **THEN** they can install, configure, and deploy the unified MCP server within 15 minutes

## MODIFIED Requirements

None — this is a greenfield restructuring within the existing repository.

## REMOVED Requirements

### Requirement: 7 Independent MCP Server Packages

**Reason**: The single-tool-per-server architecture multiplies operational overhead (7 cold starts, 7 deploys, 7 npm packages) and fragments the tool catalog. The MCP 2026-07-28 specification's Streamable HTTP transport and `McpAgent` pattern make multi-tool servers the standard approach. **Migration**: All 7 npm packages (`@florentin-one/mcp-collaborative-reasoning`, `@florentin-one/mcp-constraint-solver`, `@florentin-one/mcp-metacognitive-monitoring`, `@florentin-one/mcp-narrative-planner`, `@florentin-one/mcp-scientific-method`, `@florentin-one/mcp-sequential-thinking`, `@florentin-one/mcp-structured-argumentation`) will be deprecated with a final patch release pointing users to `@florentin-one/mcp`.

### Requirement: Custom HTTP-to-MCP Workers Adapter

**Reason**: The custom `workers-adapter` in `src/shared/workers-adapter/index.ts` manually implements JSON-RPC over HTTP with CORS handling. `McpAgent.serve()` provides this natively with Streamable HTTP transport, OAuth support, and proper MCP session management. **Migration**: Delete `src/shared/workers-adapter/`. All HTTP transport is handled by `McpAgent.serve()`.
