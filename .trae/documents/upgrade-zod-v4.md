# Plan: Upgrade Zod from v3 to v4

## Summary

Bump `zod` from `3.25.76` to `^4.4.0`, remove all `as AnySchema` type-escape casts, re-enable DTS generation, and achieve full `StandardSchemaV1` protocol compatibility with `@modelcontextprotocol/server` v2.

## Current State Analysis

### Scope
- **Only 1 file** imports or uses Zod in the entire repository: `src/florentin-one-mcp/src/agent/server.ts`
- Version pinned: `"zod": "3.25.76"` (exact, in `src/florentin-one-mcp/package.json`)
- 20 schema definitions using: `z.object`, `z.enum`, `z.string`, `z.number`, `z.boolean`, `z.array`, `z.record`, `.optional()`, `.min()`, `.max()`, `.int()`
- All schemas cast to `as AnySchema` (`type AnySchema = any`) — a workaround that discards type safety because Zod v3 lacks the `StandardSchemaV1` protocol required by the v2 SDK's `registerTool`
- DTS generation disabled (`dts: false` in `tsup.config.ts`) due to the type mismatch
- Zero test files exist in the unified package

### Breaking Change Impact Assessment
| Zod v4 Breaking Change | Used in our code? | Impact |
|---|---|---|
| String formats → top-level (`z.email()` etc.) | **No** | None |
| `message` param → `error` param | **No** | None |
| `invalid_type_error` / `required_error` dropped | **No** | None |
| `errorMap` renamed to `error` | **No** | None |
| `.strict()` / `.passthrough()` → `z.strictObject()` / `z.looseObject()` | **No** | None |
| `ZodError.format()` / `.flatten()` → `z.flattenError()` etc. | **No** | None |
| Issue type renames | **No** (never accessed) | None |
| `.merge()` renamed to `.extend()` | **No** | None |
| StandardSchemaV1 protocol (`~standard` symbol) | **N/A — this is the gain** | Positive — removes need for `as AnySchema` |

**Conclusion**: Our Zod v3 usage is a minimal, API-stable subset. Zero manual schema rewrites required. This is a one-line version bump + type-cast removal.

## Proposed Changes

### Step 1: Bump zod version

**File**: `src/florentin-one-mcp/package.json` (line 54)
**Change**: `"zod": "3.25.76"` → `"zod": "^4.4.0"`

Why `^4.4.0`: The v2 SDK bundles `zod@4.4.3` internally. Pinning to `^4.4.0` ensures version alignment and avoids duplicate Zod copies in `node_modules`.

### Step 2: Remove `as AnySchema` casts

**File**: `src/florentin-one-mcp/src/agent/server.ts`

Remove the `type AnySchema = any` declaration (line 13) and all 20 `as AnySchema` casts from schema definitions (lines 24-109).

Zod v4 implements the `StandardSchemaV1` protocol. `@modelcontextprotocol/server` v2's `registerTool` accepts `StandardSchemaV1` — Zod v4 schemas satisfy this natively without casting.

**Before** (lines 24-26):
```typescript
const KnowledgeAssessmentSchema = z.object({
  domain: z.string(),
  knowledgeLevel: z.enum(["expert", "proficient", "familiar", "basic", "minimal", "none"]),
  ...
}) as AnySchema;
```

**After**:
```typescript
const KnowledgeAssessmentSchema = z.object({
  domain: z.string(),
  knowledgeLevel: z.enum(["expert", "proficient", "familiar", "basic", "minimal", "none"]),
  ...
});
```

### Step 3: Re-enable DTS generation

**File**: `src/florentin-one-mcp/tsup.config.ts` (line 9)
**Change**: `dts: false` → `dts: true`

With Zod v4's `StandardSchemaV1` compatibility, the v2 SDK's `registerTool` type contract is satisfied. The `tsc`-based DTS plugin can now resolve the `inputSchema` parameter type without error.

### Step 4: Run codemod (optional safety net)

```bash
npx zod-v3-to-v4 src/florentin-one-mcp/src/agent/server.ts
```

The community codemod (`zod-v3-to-v4`) detects any deprecated Zod v3 API usage we may have overlooked. Expected result: zero transformations (clean).

### Step 5: Reinstall and verify

```bash
cd src/florentin-one-mcp
pnpm install
npx tsup --config tsup.config.ts   # verify clean build with DTS
```

### Step 6: Verify type safety

**File**: `src/florentin-one-mcp/src/agent/server.ts`

Confirm that handler parameter types are now inferred from zod schemas rather than `Record<string, unknown>`. If `registerTool`'s generic inference works, replace the explicit `Record<string, unknown>` annotations with the inferred types or keep them if inference fails through the callback chain.

## Files Changed

| File | Change |
|---|---|
| `src/florentin-one-mcp/package.json` | `"zod": "3.25.76"` → `"zod": "^4.4.0"` |
| `src/florentin-one-mcp/src/agent/server.ts` | Remove `type AnySchema = any` + 20 `as AnySchema` casts |
| `src/florentin-one-mcp/tsup.config.ts` | `dts: false` → `dts: true` |

## Assumptions & Decisions

1. **`^4.4.0` is the correct floor**: Chosen because the v2 SDK's bundled `zod@4.4.3` is the nearest known-compatible version. A broader `^4.0.0` would also work; `^4.4.0` is defensive.
2. **No codemod execution in CI**: The codemod is a one-time migration safety net, not part of the build pipeline.
3. **Handler types stay as `Record<string, unknown>`**: Even with StandardSchema compatibility, `registerTool`'s generic inference through the callback chain may not propagate to handler args. We keep explicit annotations as a fallback — the goal is DTS generation + removal of unsafe casts, not full end-to-end type inference.
4. **`pnpm-lock.yaml` will update**: Lockfile regeneration is expected. No other dependency changes.

## Verification

- [ ] `pnpm install` completes without zod version conflicts
- [ ] `npx tsup --config tsup.config.ts` produces clean ESM build + DTS (no type errors)
- [ ] `pnpm run check` (root `tsc --noEmit`) passes
- [ ] All 7 `registerTool` calls compile without `as AnySchema` casts
- [ ] `dist/index.d.ts` and `dist/worker.d.ts` are generated
- [ ] No `as any` or `as AnySchema` remains in `server.ts`
