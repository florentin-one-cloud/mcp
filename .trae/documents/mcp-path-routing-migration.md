# Plan: Migrate MCP Servers to Path-Based Routing via Gateway Worker

## Summary

Migrate all 7 MCP servers from subdomain-based routing (`{name}.florentin-one.de`) to path-based routing under a single domain (`mcp.florentin-one.de/{name}`) using a new **Router Gateway Worker** with HTTP service bindings. Old subdomain URLs will break intentionally.

## Current State

| MCP Server | Current URL | Wrangler Config |
|---|---|---|
| collaborative-reasoning | `collaborative-reasoning.florentin-one.de` | Custom Domain |
| constraint-solver | `constraint-solver.florentin-one.de` | Custom Domain |
| metacognitive-monitoring | `metacognitive-monitoring.florentin-one.de` | Custom Domain |
| narrative-planner | `narrative-planner.florentin-one.de` | Custom Domain |
| scientific-method | `scientific-method.florentin-one.de` | Custom Domain |
| sequential-thinking | `sequential-thinking.florentin-one.de` | Custom Domain |
| structured-argumentation | `structured-argumentation.florentin-one.de` | Custom Domain |

Each server is an independent Worker with its own `wrangler.jsonc`, using `custom_domain: true` routes. All share the same `workers-adapter` pattern (POST-only JSON-RPC handler). All share a PostHog secrets store binding (`posthog-project-token_mcp`).

## Architecture: Router Gateway Worker

A new `mcp-gateway` Worker owns the `mcp.florentin-one.de` custom domain and dispatches requests to backend Workers via **HTTP service bindings**:

```
Client → mcp.florentin-one.de/collaborative-reasoning
  → mcp-gateway Worker
    → env.COLLABORATIVE_REASONING.fetch(request)
      → collaborative-reasoning Worker (backend)
```

Service bindings are zero-latency (same thread, same server). The gateway extracts the first path segment, matches it to a service binding, and forwards the request. Each backend Worker remains independently deployable.

## Implementation Plan

### Step 1: Create the `mcp-gateway` Worker

**New files to create:**

#### 1a. [src/gateway/wrangler.jsonc](src/gateway/wrangler.jsonc)

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "mcp-gateway",
  "main": "dist/worker.js",
  "compatibility_flags": ["nodejs_compat"],
  "compatibility_date": "2026-07-29",
  "workers_dev": true,
  "preview_urls": true,
  "observability": {
    "logs": {
      "enabled": true,
      "invocation_logs": false
    }
  },
  "services": [
    { "binding": "COLLABORATIVE_REASONING", "service": "collaborative-reasoning" },
    { "binding": "CONSTRAINT_SOLVER", "service": "constraint-solver" },
    { "binding": "METACOGNITIVE_MONITORING", "service": "metacognitive-monitoring" },
    { "binding": "NARRATIVE_PLANNER", "service": "narrative-planner" },
    { "binding": "SCIENTIFIC_METHOD", "service": "scientific-method" },
    { "binding": "SEQUENTIAL_THINKING", "service": "sequential-thinking" },
    { "binding": "STRUCTURED_ARGUMENTATION", "service": "structured-argumentation" }
  ],
  "routes": [
    {
      "pattern": "mcp.florentin-one.de/*",
      "custom_domain": true
    }
  ]
}
```

#### 1b. [src/gateway/src/worker.ts](src/gateway/src/worker.ts)

The gateway Worker extracts the path segment and routes to the correct backend:

```typescript
const ROUTE_MAP: Record<string, string> = {
  "collaborative-reasoning": "COLLABORATIVE_REASONING",
  "constraint-solver": "CONSTRAINT_SOLVER",
  "metacognitive-monitoring": "METACOGNITIVE_MONITORING",
  "narrative-planner": "NARRATIVE_PLANNER",
  "scientific-method": "SCIENTIFIC_METHOD",
  "sequential-thinking": "SEQUENTIAL_THINKING",
  "structured-argumentation": "STRUCTURED_ARGUMENTATION",
};

export default {
  async fetch(request: Request, env: Record<string, { fetch: (req: Request) => Promise<Response> }>): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const serverName = pathSegments[0];

    if (!serverName || !ROUTE_MAP[serverName]) {
      return new Response(JSON.stringify({
        error: "Not found",
        available: Object.keys(ROUTE_MAP),
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const binding = env[ROUTE_MAP[serverName]];
    return binding.fetch(request);
  },
};
```

Key design decisions:
- The gateway passes the original `request` directly to the backend (path preserved). Backends ignore the path — they only process POST body.
- CORS is handled by each backend's `workers-adapter` already. The gateway adds a fallback `Access-Control-Allow-Origin: *` on 404s.
- A root path `/` or unknown path returns a 404 with the list of available servers.
- OPTIONS preflight requests are forwarded to backends (they handle CORS preflight).

#### 1c. [src/gateway/package.json](src/gateway/package.json)

```json
{
  "name": "@florentin-one/mcp-gateway",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "bun build ./src/worker.ts --outfile='./dist/worker.js' --target='node' --format='esm'",
    "deploy": "bunx wrangler deploy",
    "dev": "bunx wrangler dev dist/worker.js"
  }
}
```

#### 1d. [src/gateway/tsconfig.json](src/gateway/tsconfig.json)

```json
{
  "$schema": "https://json-schemastore.org/tsconfig",
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["./src/**/*.ts"]
}
```

### Step 2: Remove custom domain routes from all 7 backend Workers

**Files to modify** (7 files):
- [src/collaborative-reasoning/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/collaborative-reasoning/wrangler.jsonc)
- [src/constraint-solver/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/constraint-solver/wrangler.jsonc)
- [src/metacognitive-monitoring/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/metacognitive-monitoring/wrangler.jsonc)
- [src/narrative-planner/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/narrative-planner/wrangler.jsonc)
- [src/scientific-method/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/scientific-method/wrangler.jsonc)
- [src/sequential-thinking/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/sequential-thinking/wrangler.jsonc)
- [src/structured-argumentation/wrangler.jsonc](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/structured-argumentation/wrangler.jsonc)

**Change**: Remove the `routes` array entirely from each backend. The backends will only be accessible via `workers.dev` subdomains (for testing) and via service bindings from the gateway.

```jsonc
// REMOVE this block from each wrangler.jsonc:
"routes": [
  {
    "pattern": "collaborative-reasoning.florentin-one.de",
    "custom_domain": true
  }
]
```

Keep `workers_dev: true` so backends remain accessible via their `*.workers.dev` URLs for debugging.

### Step 3: Update the monorepo build script

**File to modify**: [package.json](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/package.json)

The `workspaces` field already includes `src/*`, so the new `src/gateway` will be picked up automatically. No changes needed unless the build script needs to include gateway.

Verify `build-all` script covers the gateway:
```json
"build-all": "bun run --filter='./src/*' build"
```
This already covers `src/*` including `src/gateway`. Confirm gateway's `build` script works.

### Step 4: Deploy order (critical)

Service bindings require the target Worker to exist before the caller is deployed.

1. Deploy all 7 backend Workers first (they already exist, just removing routes):
   ```bash
   cd src/collaborative-reasoning && bunx wrangler deploy
   cd src/constraint-solver && bunx wrangler deploy
   cd src/metacognitive-monitoring && bunx wrangler deploy
   cd src/narrative-planner && bunx wrangler deploy
   cd src/scientific-method && bunx wrangler deploy
   cd src/sequential-thinking && bunx wrangler deploy
   cd src/structured-argumentation && bunx wrangler deploy
   ```

2. Create DNS record for `mcp.florentin-one.de`:
   - Add a proxied CNAME or A record pointing to Cloudflare (orange cloud)
   - This can be done via Cloudflare dashboard or `wrangler` (custom domain auto-provisions)

3. Deploy the gateway Worker:
   ```bash
   cd src/gateway && bun build ./src/worker.ts --outfile='./dist/worker.js' --target='node' --format='esm' && bunx wrangler deploy
   ```

### Step 5: Update documentation

**Files to modify**:
- [README.md](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/README.md) — Update Worker Endpoints section (line ~125)
- [src/collaborative-reasoning/README.md](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/collaborative-reasoning/README.md#L42) — Update HTTP endpoint URL
- All other server README.md files — Update HTTP endpoint URLs

Update from:
```
https://{server-name}.{account}.workers.dev
```
To:
```
https://mcp.florentin-one.de/{server-name}
```

### Step 6: Update MCP client configurations

Update `.trae/mcp.json` and any other MCP client configs to use the new URLs:
```
https://mcp.florentin-one.de/collaborative-reasoning
https://mcp.florentin-one.de/constraint-solver
https://mcp.florentin-one.de/metacognitive-monitoring
https://mcp.florentin-one.de/narrative-planner
https://mcp.florentin-one.de/scientific-method
https://mcp.florentin-one.de/sequential-thinking
https://mcp.florentin-one.de/structured-argumentation
```

## Edge Cases

1. **Root path `/`**: Gateway returns 404 with available servers list. This is useful as a discovery endpoint.

2. **OPTIONS preflight**: Forwarded to backends. Each backend's `workers-adapter` handles CORS preflight. If the MCP client sends OPTIONS to `mcp.florentin-one.de/collaborative-reasoning`, the gateway forwards it to the backend which returns proper CORS headers.

3. **Backend availability**: If a backend Worker is down, the service binding will return an error. The gateway does not retry — this is correct behavior for MCP.

4. **Subrequest limit**: Each service binding call counts as a subrequest. The limit is 32 per request. For MCP, each request hits exactly 1 backend, so this is not a concern.

5. **Gateway Worker does NOT need PostHog**: Analytics are handled by each backend. The gateway is pure routing.

6. **Future servers**: To add a new MCP server, add a new entry to `ROUTE_MAP` in the gateway and a new service binding in `wrangler.jsonc`. Redeploy gateway.

## Files Summary

### New files (4):
- `src/gateway/wrangler.jsonc`
- `src/gateway/src/worker.ts`
- `src/gateway/package.json`
- `src/gateway/tsconfig.json`

### Modified files (9):
- `src/collaborative-reasoning/wrangler.jsonc` — remove routes
- `src/constraint-solver/wrangler.jsonc` — remove routes
- `src/metacognitive-monitoring/wrangler.jsonc` — remove routes
- `src/narrative-planner/wrangler.jsonc` — remove routes
- `src/scientific-method/wrangler.jsonc` — remove routes
- `src/sequential-thinking/wrangler.jsonc` — remove routes
- `src/structured-argumentation/wrangler.jsonc` — remove routes
- `README.md` — update endpoint URLs
- All server README.md files — update endpoint URLs

## Verification Checklist

- [ ] `src/gateway/` directory created with all 4 files
- [ ] All 7 backend wrangler.jsonc files have `routes` removed
- [ ] `mcp.florentin-one.de` DNS record exists and is proxied
- [ ] Backend Workers deployed (no custom domain routes)
- [ ] Gateway Worker deployed (custom domain on `mcp.florentin-one.de`)
- [ ] POST to `https://mcp.florentin-one.de/collaborative-reasoning` returns valid JSON-RPC response
- [ ] POST to `https://mcp.florentin-one.de/unknown` returns 404 with available servers
- [ ] OPTIONS preflight works on all endpoints
- [ ] Old subdomain URLs no longer work (expected)
- [ ] README files updated with new URLs
- [ ] MCP client configs updated
