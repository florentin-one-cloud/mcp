# Review, Testing & Validation Instructions — PR #20 (Unified MCP Server Refactor)

## 1. Summary / Purpose

This document is the reviewer's executable checklist for PR [#20](https://github.com/florentin-one-cloud/mcp/pull/20). It maps every claim in [pull-request.md](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/.trae/documents/pull-request.md) to a concrete file to inspect, a command to run, and a pass/fail gate. It also surfaces discrepancies found during exploration that the PR description does not state.

Scope of the change under review:

- 7 standalone MCP packages merged into one `@florentin-one/mcp` package + one Cloudflare Worker.
- `@modelcontextprotocol/sdk` v1 replaced by `@modelcontextprotocol/server` v2 (MCP 2026-07-28).
- Custom HTTP adapter replaced by `createMcpHandler` from the Cloudflare Agents SDK.
- Code Mode preserved as direct TypeScript exports.

## 2. Current State Analysis (grounded findings)

Source of truth: git `HEAD` on branch `update/20.08.2026`, working tree clean except `A .trae/documents/pull-request.md`.

- Only one workspace package remains under `src/`: `florentin-one-mcp`. `src/shared/` now contains only `test-utils/`. The 7 legacy sub-packages and `src/shared/workers-adapter/` are deleted (git commits `0c026e1`, `d2eb69d`).
- `src/florentin-one-mcp/package.json` deps: `@modelcontextprotocol/server ^2.0.0`, `agents ^0.20.1`, `zod ^4.4.0`, `chalk 5.3.0`, `expr-eval 2.0.2`, `posthog-node 5.46.1`, `@posthog/mcp 0.10.1`.
- [server.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/agent/server.ts) registers 7 tools via `server.registerTool(...)` and 2 prompts via `server.registerPrompt(...)`. Zod schemas are defined inline, no `as AnySchema` casts remain.
- [worker.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/worker.ts) exports a `fetch(request, env, ctx)` default that delegates to `createMcpHandler(createServer)`.
- [wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/wrangler.jsonc) has NO `durable_objects` and NO `migrations` — the stateless `createMcpHandler` pattern requires none.
- [index.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/index.ts) exposes the stdio transport (`StdioServerTransport` from `@modelcontextprotocol/server/stdio`) and re-exports all 7 Code Mode classes.
- Tiered test framework exists: [vitest.config.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/vitest.config.ts) (workspace projects `unit`/`integration`/`e2e`), CI in [test.yml](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/.github/workflows/test.yml) and deploy gating in [deploy.yml](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/.github/workflows/deploy.yml).

### Discrepancies the reviewer MUST flag (not stated in the PR description)

1. **`@modelcontextprotocol/sdk` is NOT fully removed.** It was removed as a direct dependency, but `@modelcontextprotocol/sdk@1.30.0` survives transitively via `@posthog/mcp@0.10.1` (lockfile peer `>=1.26.0`). Two MCP SDK majors coexist in the dependency graph. The v1 SDK is externalized in [tsup.config.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/tsup.config.ts), so it is not bundled — but this is a latent dual-SDK surface. Gate: confirm no direct import of `@modelcontextprotocol/sdk` remains in source; note the transitive remnant.
2. **Zod v4 was not part of this merge PR.** The PR table lists `zod ^4.4.0`, but the merge originally pinned `zod@3.25.76`; the v4 upgrade landed later in commit `89395bb`. Gate: verify current state is `zod ^4.4.0` with no `as AnySchema` casts and DTS generation re-enabled (`dts: true`).
3. **E2E `initialize` sends the wrong protocol version string.** [smoke.test.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/__tests__/e2e/smoke.test.ts#L77) negotiates `protocolVersion: "2025-06-18"`, not `"2026-07-28"`. The PR claims a 2026-07-28 upgrade. Gate: confirm the correct `protocolVersion` string for the v2 server and correct the test if needed.
4. **The integration test no longer exercises `tools/list` over JSON-RPC.** [server.test.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/__tests__/integration/server.test.ts) tests the 7 codemode classes directly, not the `createServer()` tool registry. Only the E2E smoke test (skipped without `CLOUDFLARE_API_TOKEN`) asserts `tools/list` returns ≥7 tools. Gate: the "all 7 tools registered" claim is only validated at runtime in E2E, not in CI-fast paths.
5. **`instrumentMcpServer` is effectively a no-op for McpServer v2.** [posthog.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/lib/posthog.ts#L67) wraps the v1-targeted `@posthog/mcp` `instrument()` in try/catch. The real instrumentation is the per-tool `p.capture(...)` calls in `server.ts`. Gate: verify per-tool capture is the authoritative path; confirm no exception when PostHog keys are absent (graceful degradation).

## 3. Proposed Changes — Review & Validation Instructions

No code changes are proposed. The deliverable is the review protocol below, executed by the reviewer.

### 3.1 Architecture claims → file/command gates

| PR claim | Verify by | Pass criterion |
| --- | --- | --- |
| 7 directories deleted | `ls src/` | Only `florentin-one-mcp/` and `shared/` remain |
| `workers-adapter/` removed | `ls src/shared/` | Only `test-utils/` (and no `workers-adapter/`) |
| `McpServer.registerTool()` | read [server.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/agent/server.ts#L128-L224) | 7 `registerTool` + 2 `registerPrompt` calls present |
| `createMcpHandler` routing | read [worker.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/worker.ts#L1-L9) | `fetch` delegates to `createMcpHandler(createServer)` |
| No Durable Object needed | read [wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/wrangler.jsonc) | no `durable_objects`, no `migrations` |
| Code Mode preserved | read [index.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/src/index.ts#L8-L17) | 7 Code Mode classes re-exported |

### 3.2 Build & static validation commands

Run from repo root, in order. All MUST exit 0.

```
pnpm install --frozen-lockfile
pnpm run build-all      # florentin-one-mcp: tsup (ESM) + tsc; emits dist/index.js + dist/worker.js + *.d.ts
pnpm run check          # root tsc --noEmit
```

Pass gate: `dist/index.js`, `dist/worker.js`, `index.d.ts` exist and are non-empty; `check` reports zero errors. If `check` reports errors in `src/shared/posthog/index.ts`, verify that stale file is no longer in the workspace (it should have been removed).

### 3.3 Test validation commands (tiered)

```
pnpm run test:unit          # MUST pass, <10s  (~86 tests: analyzer + tracker)
pnpm run test:integration   # MUST pass, <60s (~11 tests: codemode integration)
pnpm run test:e2e           # skips without CLOUDFLARE_API_TOKEN (4 tests)
pnpm run test:all           # default-project run (pnpm -r test)
```

Pass gate: unit and integration green. E2E skips locally — do not treat skip as failure. Note the tier mismatch: `test:all` uses the default node project (runs all files including e2e which self-skips), whereas CI `test.yml` uses the three `--project` scripts. Both paths MUST terminate cleanly.

### 3.4 Runtime / protocol validation (tool discovery + input validation)

Validate the PR's own "Testing Suggestions" at the wire level. Start the worker locally:

```
cd src/florentin-one-mcp && pnpm exec wrangler dev
```

Then issue JSON-RPC requests against the local URL:

```
# 1. tools/list — all 7 tools registered
curl -s http://localhost:8787 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
# PASS: result.tools.length == 7; each has name/description/inputSchema

# 2. tools/call with malformed input — Zod catches, standard error response
curl -s http://localhost:8787 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"metacognitiveMonitoring","arguments":{"task":123}},"id":2}'
# PASS: no uncaught exception; response is a JSON-RPC error or isError:true result
```

Pass gate: `tools/list` returns exactly 7 tools; malformed input produces a structured (non-crash) response.

### 3.5 Deploy validation (bundle size + startup)

```
cd src/florentin-one-mcp && pnpm exec wrangler deploy --dry-run
```

Pass gate: dry-run completes; note the reported bundle size and confirm it is below Cloudflare free/paid Worker limits. This validates the PR's "Bundle Size Limits" concern without touching production.

## 4. Assumptions & Decisions

- The review targets `HEAD` of branch `update/20.08.2026`, which already includes the follow-up Zod-v4 upgrade and testing-framework commits. The PR description describes the merge as of `0c026e1`; the reviewer MUST review the merge commit in isolation AND the current branch state.
- `createMcpHandler` internal behavior is assumed per the Agents SDK v0.20.1 contract; no Durable Object class is required because the handler is stateless.
- The deployed `workers.dev` hostname in the E2E test (`florentin-one-mcp.florentin-one.workers.dev`) MUST match the `name` in `wrangler.jsonc`.

## 5. Verification Steps (definition of done)

1. All gates in §3.1–3.5 pass.
2. Discrepancies §2 items 1–5 are explicitly acknowledged by the reviewer and either fixed or waived with rationale.
3. `pnpm run build-all && pnpm run check && pnpm run test:unit && pnpm run test:integration` exit 0 on a clean checkout.
4. `wrangler dev` `tools/list` returns 7 tools; malformed `tools/call` does not crash.
5. `wrangler deploy --dry-run` reports a bundle within Cloudflare limits.

## 6. Edge Cases & Compliance

- **Peak-load fault tolerance:** the single Worker consolidates cold-start to one entry point. ENSURE the reviewer confirms no per-request Durable Object instantiation is attempted; under rapid `tools/call` fan-in, a circuit-breaker is NOT required but observability (`observability.logs.enabled`) MUST remain on for triage.
- **GDPR Art. 28 / data sovereignty:** tool arguments are transmitted to PostHog (EU-hosted `https://eu.i.posthog.com`) and, in production, transit the Worker. ENSURE the reviewer confirms no PII or client-confidential material is written into tool args; PostHog degradation is graceful when keys are absent.
- **Auth surface change:** the legacy adapter's `Access-Control-Allow-Origin: *` is gone; CORS/auth is now governed by `createMcpHandler`/Agents SDK defaults. ENSURE the reviewer confirms the intended access model for the public reasoning endpoint.
- **Idempotency of PostHog flush:** each tool handler calls `await p.flush()`; if PostHog is unreachable, this MUST not block the tool result (verify the try/catch boundary in `server.ts` isolates capture from the response path).
