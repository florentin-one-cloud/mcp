# Plan: Fix `pnpm run check` TypeScript errors

## Summary

`pnpm run check` (`tsc --noEmit`, root [tsconfig.json](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/tsconfig.json)) exits with code 2. ~80 type errors across 8 files, all in **tests, templates, and one script** — zero `src/*/src/**` production files. Five root causes. Decision (from user): **fix test files properly**, keep `__tests__/` in type-check scope; exclude only non-compilable copy-target templates.

## Current State Analysis

The root [tsconfig.json](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/tsconfig.json) has `strict: true`, `exactOptionalPropertyTypes: true`, `lib: ["ESNext"]` (no DOM), and **no `include`/`exclude`**, so `tsc --noEmit` type-checks every `.ts` under the repo: `scripts/`, `templates/`, `src/**/__tests__/`, and `src/shared/`.

Failing files and root cause:

| # | File(s) | Root cause | Error codes |
|---|---------|-----------|-------------|
| C1 | `src/florentin-one-mcp/__tests__/e2e/smoke.test.ts` | `Response.json()` resolves `unknown` (no DOM lib) | TS18046 |
| C2 | `__tests__/unit/analyzer.test.ts`, `__tests__/unit/tracker.test.ts` | `createTestFixture` returns `Partial<T>` with narrow inferred `T`, rejecting optional-field overrides | TS2353 |
| C3 | `scripts/test-cleanup.ts` | `ReturnType<typeof readdir>` selects Buffer overload → `Dirent<NonSharedBuffer>[]` | TS2322, TS2345, TS2367 |
| C4 | `__tests__/helpers/cloudflare-mocks.ts` | Miniflare 5 alpha config has no `modules`; `getKVNamespace`/`getR2Bucket` return undici-typed bindings not assignable to global `KVNamespace`/`R2Bucket` | TS2353, TS2322 |
| C5 | `templates/*.test.ts` | copy-targets import `@florentin-one/test-utils` + `../helpers/cloudflare-mocks.js` that do not resolve from `templates/` | TS2307 |

## Proposed Changes

### 1. [tsconfig.json](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/tsconfig.json) — exclude templates (C5)

Add an `exclude` array so the check scope is production source + real tests + scripts, not copy-targets.

```jsonc
"compilerOptions": { /* unchanged */ },
"exclude": ["templates", "dist", "node_modules"]
```

**Why:** `templates/*.test.ts` are copy-targets whose relative imports resolve only after being copied into a package's `__tests__/`. They can never type-check in place. **How:** the root tsconfig is used only by `pnpm run check`; the sub-package build uses `src/florentin-one-mcp/tsconfig.json`, so this exclusion does not affect builds.

### 2. [src/shared/test-utils/index.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/shared/test-utils/index.ts) — widen fixture override type (C2)

Change the `createTestFixture` return signature so overrides may add keys not present in the default object.

```ts
export function createTestFixture<T extends Record<string, unknown>>(defaults: T) {
  return (overrides?: Partial<T> & Record<string, unknown>): T => {
    if (!overrides) return { ...defaults };
    return { ...defaults, ...overrides } as T;
  };
}
```

**Why:** `validInputFixture({ knowledgeAssessment: ... })` and `validThoughtFixture({ isRevision: true })` pass optional fields not in the inferred default `T`, violating `Partial<T>`. **How:** intersect with `Record<string, unknown>` to accept the extra keys; the `as T` cast is required because spreading an index-signature widens the result. This preserves the strong `T` return type (the tests dereference the *validator's* result, typed as the full interface, not the fixture).

### 3. [scripts/test-cleanup.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/scripts/test-cleanup.ts) — remove conditional-type annotation (C3)

In both `findTestDirs.walk` and `findTsFiles.walk`, delete the `let entries: ReturnType<typeof readdir> extends Promise<infer T> ? T : never;` annotation and use plain inference.

```ts
const entries = await readdir(dir, { withFileTypes: true });
```

**Why:** the conditional type resolves to the **last** `readdir` overload (`encoding: Buffer`) → `Dirent<NonSharedBuffer>[]`, making `entry.name` a `NonSharedBuffer` and triggering the `=== "node_modules"` / `path.join` errors. **How:** let TS infer `Dirent<string>[]` from the `{ withFileTypes: true }` options object. Two occurrences (lines ~56 and ~89); both drop the annotation.

### 4. [src/florentin-one-mcp/__tests__/e2e/smoke.test.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/__tests__/e2e/smoke.test.ts) — type the JSON body (C1)

Add a contract interface near the top of the file and cast each `response.json()` result to it (four sites: lines ~41, ~87, ~126, ~169).

```ts
interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface McpContentItem {
  type: string;
  text: string;
}

interface McpJsonRpcResponse {
  jsonrpc: string;
  id: number;
  result: {
    tools: McpTool[];
    serverInfo: { name: string };
    capabilities: { tools: unknown };
    content: McpContentItem[];
    isError: boolean;
  };
}
```

Then replace each `const body = await response.json();` with:

```ts
const body = (await response.json()) as McpJsonRpcResponse;
```

**Why:** `body` is `unknown` under `lib: ["ESNext"]`, so `body.result.tools` etc. fail. **How:** the interface documents the well-formed MCP response contract the smoke test asserts; casting `unknown` to it is valid, and the runtime `expect()` assertions still enforce the actual shape. No `any`, no non-null assertions, no production change.

### 5. [src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts](file:///Users/florentin/Repositories/florentin-one-cloud/mcp/src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts) — Miniflare 5 API drift (C4)

Two changes:

- Remove `modules: true` from the worker `config` object (line 12). Miniflare `5.20260815.0-alpha` `workers[].config` has no `modules` key.
- Drop the mismatched explicit return types on `getMockKV` (line 29) and `getMockR2` (line 36), letting inference produce the Miniflare-native binding type:

```ts
export async function getMockKV(miniflare: Miniflare) {
  return miniflare.getKVNamespace("TEST_KV");
}

export async function getMockR2(miniflare: Miniflare) {
  return miniflare.getR2Bucket("TEST_R2");
}
```

**Why:** `getKVNamespace`/`getR2Bucket` return `ReplaceWorkersTypes<KVNamespace_2>`/`ReplaceWorkersTypes<R2Bucket_2>` (workers-types/experimental with undici `Headers`), not assignable to the global `KVNamespace`/`R2Bucket`. **How:** inference avoids the annotation entirely. `getMockD1` (line 43) is left unchanged — it compiles (no error reported). `script`, `kvNamespaces`, `r2Buckets`, `d1Databases` keys are still valid in Miniflare 5 (only `modules` errored).

## Assumptions & Decisions

- **Test files stay in check scope** (user decision). Only `templates/` is excluded.
- `scripts/test-cleanup.ts` is a real executable script (`npx tsx scripts/test-cleanup.ts`); its `Dirent` errors are genuine and are fixed, not excluded.
- `cloudflare-mocks.ts` is currently unreferenced by active tests (only `server.test.ts` runs, importing from `shared/test-utils`). Its fix targets type-correctness only; runtime ESM-vs-Script semantics of the no-op worker are out of scope.
- `noUncheckedIndexedAccess` is `false`, so array index accesses (`content[0].text`) need no non-null assertion.
- No production source, build config, or dependency versions change.

## Verification

1. `pnpm run check` → exits 0, no output.
2. `pnpm run test:unit` → unit tests still pass (fixture/analyzer/tracker behavior unchanged).
3. `git diff --stat` → changes limited to the 5 files above (1 config + 1 script + 3 test/helper files).
4. Confirm no `templates/` or `dist/` files appear in the tsc error output (exclusion effective).
