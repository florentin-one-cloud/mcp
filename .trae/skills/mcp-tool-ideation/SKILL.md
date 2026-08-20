---
name: mcp-tool-ideation
version: 0.1.0
description: Evaluates new MCP tool proposals with RICE scoring, MCP 2026-07-28 specification compatibility validation, and generates an integration plan into the FlorentinOneMCP unified server. Trigger phrases "propose a tool", "new MCP tool idea", "evaluate this tool proposal", "should we build this MCP tool", "ideate an MCP tool", "assess this tool for MCP".
---

# mcp-tool-ideation

Evaluates new MCP tool proposals through a structured 4-stage pipeline: (1) elicit tool metadata, (2) calculate RICE score, (3) validate against MCP 2026-07-28 specification requirements, (4) generate a concrete integration plan into the FlorentinOneMCP Cloudflare Worker server. Produces a scored recommendation (APPROVE / REVISE / REJECT) with an implementation roadmap.

## When to Use

- A developer proposes a new MCP tool for the Florentin One Enterprise MCP Server Ecosystem.
- An existing tool requires a structured cost-benefit assessment before resource allocation.
- Planning the next tool to add to the unified `florentin-one-mcp` server's reasoning toolkit.
- Comparing multiple competing tool proposals to prioritize implementation order.

## When NOT to Use

- Do NOT use for evaluating changes to existing tool implementations (bug fixes, refactors) — RICE scoring overweights against incremental improvements.
- Do NOT use for tools that are not MCP server tools (e.g., internal utilities, build scripts, non-MCP APIs).
- Do NOT use for tools whose scope exceeds a single tool definition (monolithic services break the stateless contract).
- Do NOT use when the proposal lacks a concrete input/output contract — the skill cannot fabricate missing specifications.

## Prerequisites

- The proposer MUST articulate the tool's purpose in one sentence.
- The proposer MUST define at least one concrete use case with user persona.
- The `src/florentin-one-mcp/` and `src/<tool-name>/` directory patterns from this repo MUST be available as reference.
- Access to `https://modelcontextprotocol.io/specification/2026-07-28` for spec reference.

## Workflow

### Step 1: Elicit Tool Metadata

Extract from the proposal (ask if missing):

1. **Purpose** — one-sentence description of what the tool does.
2. **Inputs** — parameter names, types, required/optional, validation constraints.
3. **Outputs** — response shape (text, structured JSON, error codes).
4. **Target users** — persona (e.g., LSTR reasoning chain, external agent, human operator).
5. **Relationship to existing tools** — does it complement `sequentialthinking`, `collaborativeReasoning`, `metacognitiveMonitoring`, `structuredArgumentation`, `scientificMethod`, `constraintSolver`, or is it a net-new capability?

> **Why:** Metadata drives the RICE dimensions. Without a concrete input/output contract, spec compatibility cannot be validated and the RICE "Confidence" score defaults to 0%.

Output this as a **Tool Proposal Summary** table:

```markdown
| Field | Value |
|-------|-------|
| Name | `<tool-name>` |
| Purpose | `<one sentence>` |
| Inputs | `<param: type (required/optional)>` |
| Output | `<response shape>` |
| Users | `<persona list>` |
| Related tools | `<complements / net-new>` |
```

### Step 2: Calculate RICE Score

Apply the RICE scoring model from https://www.productplan.com/glossary/rice-scoring-model. Score each dimension independently, then compute `RICE = (Reach × Impact × Confidence) / Effort`.

#### 2.1 Reach

Estimate the number of use cases or user sessions per month this tool would serve within the LSTR ecosystem. Document the estimation method.

| Reach Tier | Score | Trigger |
|------------|-------|---------|
| Niche | 1 | ≤1 use case, single persona |
| Limited | 3 | 2–5 use cases |
| Broad | 5 | 6–15 use cases |
| Pervasive | 10 | >15 use cases or used by every reasoning chain invocation |

> **Why Reach tiers not raw numbers:** Fine-grained user counts are unreliable for internal tooling. Tiered scoring produces reproducible cross-proposal comparisons.

#### 2.2 Impact

Score on a 1–5 scale measuring the tool's effect on reasoning quality, developer velocity, or system capability.

| Impact | Score | Criteria |
|--------|-------|----------|
| Minimal | 1 | Slight convenience, no capability gap filled |
| Low | 2 | Moderate time savings for a narrow workflow |
| Medium | 3 | Fills a capability gap or measurably reduces error rate |
| High | 4 | Enables new reasoning modalities or unlocks dependent tools |
| Transformative | 5 | Foundational — other tools or skills depend on its existence |

#### 2.3 Confidence

Express as percentage (0–100%) reflecting certainty in the Reach, Impact, and Effort estimates. Use this rubric:

| Confidence | Score | Criteria |
|------------|-------|----------|
| Gut feel | 20% | No data, purely speculative |
| Analogous | 50% | Comparable to an existing tool with usage data |
| Partial data | 80% | Some measurement but incomplete |
| Validated | 100% | Prototype exists, usage data collected |

> **Why:** Confidence modulates the RICE score downward when estimates are speculative. A high-reach, high-impact proposal with 20% confidence is a gamble, not a plan.

#### 2.4 Effort

Estimate in person-weeks (1 pw = 40 hours of focused development). Include design, implementation, testing, documentation, and integration.

| Effort Tier | Person-weeks | Typical scope |
|-------------|-------------|---------------|
| Trivial | 0.5 | Single tool with no state, no async, no external dependency |
| Small | 1 | Tool with ≤5 parameters, simple logic |
| Medium | 2 | Tool with external API call or complex validation |
| Large | 4 | Multi-step tool with state management or MRTR |
| Major | 8+ | Requires new infrastructure or protocol extension |

> **Why person-weeks not hours:** Hours encourage false precision. Person-weeks align with sprint planning and absorb communication/setup overhead.

#### 2.5 RICE Formula

```
RICE = (Reach × Impact × Confidence) / Effort
```

- Round to 1 decimal place.
- If Effort is 0.5, the minimum RICE score for a 1/1/20% proposal is 0.4.
- Record all four inputs and the computed score in a **RICE Scorecard** table.

### Step 3: MCP 2026-07-28 Specification Compatibility

Validate the tool proposal against the following mandatory requirements from the MCP 2026-07-28 specification. Each requirement is a pass/fail gate.

#### 3.1 Compatibility Checklist

| # | Requirement | Check | Status |
|---|-------------|-------|--------|
| 1 | **Stateless.** Tool MUST NOT depend on `Mcp-Session-Id` or `initialize`/`initialized` handshake state. Each invocation is self-contained with `_meta` carrying protocol version and capabilities. | If tool needs cross-call state, it MUST use explicit handles in tool arguments, not hidden protocol sessions. | PASS / FAIL |
| 2 | **Streamable HTTP transport.** Tool input/output MUST be JSON-serializable over HTTP POST. MUST NOT require WebSocket, SSE, or bidirectional streams. | If the tool needs streaming, it MUST use Multi Round-Trip Requests (MRTR) or return a polling endpoint. | PASS / FAIL |
| 3 | **JSON Schema input validation.** Tool MUST define `inputSchema` as a JSON Schema object (2020-12 dialect recommended, `type: "object"` with `properties`). Use `zod` schemas internally for runtime validation — they serialize to JSON Schema. | If any parameter type outside JSON Schema vocabulary, FAIL. | PASS / FAIL |
| 4 | **No sessions.** Tool MUST NOT issue or consume `Mcp-Session-Id`. | If the tool design references session management, FAIL. | PASS / FAIL |
| 5 | **Self-describing request.** Every `tools/call` request MUST be processable without prior discovery. The tool description in `tools/list` MUST contain all information needed to construct a valid call. | If the tool has undocumented side channels or "you'll know it when you see it" parameters, FAIL. | PASS / FAIL |
| 6 | **Cache-friendly list.** Tool list results carry cache hints. The tool definition MUST be stable — changing `inputSchema` between versions is a breaking change. | If the tool design plans to mutate its schema frequently, flag as caution. | PASS / FAIL / CAUTION |
| 7 | **Error codes.** Tool errors MUST use standard JSON-RPC error codes (`-32602` for invalid params, `-32603` for internal error, `-32000` for application errors). | If the tool design uses custom error shapes outside JSON-RPC envelope, FAIL. | PASS / FAIL |

> **Why:** MCP 2026-07-28 is the current specification revision. The `@modelcontextprotocol/server` v2.0.0 dependency in `florentin-one-mcp` targets this revision. Backward-incompatible proposals waste implementation effort.

#### 3.2 Zod Schema Template

Every proposed tool MUST map its `inputSchema` to a `zod` schema following this pattern (reference: `src/sequential-thinking/src/mcp/tools.ts`):

```typescript
import { z } from "zod";

export const <ToolName>InputSchema = z.object({
  <param1>: z.<type>().describe("<description>"),
  <param2>: z.<type>().optional().describe("<description>"),
});

export type <ToolName>Input = z.infer<typeof <ToolName>InputSchema>;
```

- `zod` is the authoritative schema source. `inputSchema` for the Tool definition is derived from `zod-to-json-schema` or manually mirrored.
- Schemas for required parameters MUST use non-optional types. Use `.default()` for parameters with defaults, not `.optional()`.

### Step 4: Integration Plan

Generate a concrete, ordered integration roadmap. Each step has an exit condition.

#### 4.1 Integration Steps

```markdown
1. **Create package scaffold** — `src/<tool-name>/` with:
   - `package.json` (name: `@florentin-one/<tool-name>`, dependencies: `zod`, `@modelcontextprotocol/sdk`)
   - `tsconfig.json` extending root
   - `tsup.config.ts` for bundling
   - `vitest.config.ts` for testing
   - `wrangler.jsonc` for Cloudflare Workers deployment

2. **Define zod schema** — in `src/<tool-name>/src/mcp/tools.ts`:
   - Export `<ToolName>InputSchema` (zod object)
   - Export `<TOOL_NAME>_TOOL: Tool` with `name`, `description`, `inputSchema`

3. **Implement core logic** — in `src/<tool-name>/src/core/`:
   - `types.ts` — TypeScript interfaces
   - `logic.ts` — pure function(s) implementing the tool behavior

4. **Implement Code Mode API** — in `src/<tool-name>/src/codemode/index.ts`:
   - Export a class exposing the tool's capability as a typed TypeScript API
   - Pattern: `src/sequential-thinking/src/codemode/index.ts`

5. **Implement MCP server** — in `src/<tool-name>/src/mcp/server.ts`:
   - Export `createServer()` factory returning a configured `Server` instance
   - Register tool in `ListToolsRequestSchema` and `CallToolRequestSchema` handlers
   - Wire PostHog instrumentation via `instrumentMcpServer`

6. **Register in FlorentinOneMCP** — in the unified server entry point:
   - Import `createServer` from `@florentin-one/<tool-name>`
   - Register the tool in the merged `tools/list` response
   - Route `tools/call` for the tool name to the new server's handler

7. **Write tests** — in `src/<tool-name>/tests/`:
   - `codemode/api.test.ts` — test the Code Mode class API
   - `core/logic.test.ts` — unit tests for pure logic
   - `mcp/server.test.ts` — integration tests for MCP request handling

8. **Update documentation**:
   - Add tool to `README.md` in the root and `src/<tool-name>/README.md`
   - Add to the MCP server docs listing (e.g., `src/<tool-name>/docs/`)
   - Update `.trae/mcp.json` if the tool requires an MCP server endpoint declaration
```

#### 4.2 Integration Predecessor Graph

```
Step 1 (scaffold) → Step 2 (schema) → Step 3 (logic) → Step 4 (codemode)
                                                       ↘ Step 5 (server) → Step 6 (register)
                                                                          ↘ Step 7 (tests)
                                                                          ↘ Step 8 (docs)
```

Steps 4 and 5 can proceed in parallel after Step 3.
Steps 7 and 8 can proceed in parallel after Step 6.

### Step 5: Recommendation

Based on RICE score, spec compatibility, and integration plan feasibility, output one of:

| Recommendation | Criteria |
|----------------|----------|
| **APPROVE** | All 7 spec checks PASS, RICE ≥ 3.0, no blockers |
| **REVISE** | ≥1 spec check FAIL (fixable) OR RICE < 3.0 but with identified improvement path |
| **REJECT** | ≥1 spec check FAIL (unfixable) OR RICE < 0.5 OR duplicates existing tool capability |

If APPROVE or REVISE, include the integration roadmap in output.
If REJECT, include the specific rejection reason and what would change the assessment.

## Failure Modes

### Level 1 (Local Retry): Proposal metadata insufficient

If the proposer cannot articulate purpose, inputs, outputs, or target users: prompt with the specific missing field. Use the template: "To calculate the RICE score, I need [field]. What is the [description]? For example, [concrete example]." Retry up to 3 times. If still insufficient, emit a REJECT recommendation with `Confidence: 0%` and document the missing fields.

### Level 2 (Local Patch): Spec compatibility check ambiguous

If a spec requirement interpretation is unclear (e.g., "does this implicitly need session state?"), apply the conservative interpretation: if the tool *could* be implemented statefully, flag it as FAIL with an annotation explaining how to make it stateless. Provide a concrete revision suggestion.

### Level 3 (Replan/Escalate): Tool scope exceeds single MCP tool boundary

If the proposal describes a multi-tool system or a tool with side effects that span multiple `tools/call` invocations with hidden state: HALT. Report: "This proposal exceeds the scope of a single MCP tool. Options: (1) Decompose into N separate tools, each stateless, (2) Design as an MCP Extension using Tasks, (3) Rephrase as a standalone service with an MCP tool facade." Do NOT generate an integration plan for an over-scoped proposal.

## Output Contract

The skill MUST produce a single structured evaluation report with these sections:

1. **Tool Proposal Summary** — table from Step 1
2. **RICE Scorecard** — table with Reach, Impact, Confidence, Effort, and computed RICE score
3. **MCP 2026-07-28 Compatibility Matrix** — checklist table from Step 3 with PASS/FAIL/CAUTION status per requirement
4. **Integration Roadmap** — ordered steps with predecessor dependencies from Step 4
5. **Recommendation** — APPROVE / REVISE / REJECT with rationale

## Verification Gate

Before emitting the report, ALL of these MUST be true:

- [ ] Tool Proposal Summary has all 6 fields populated (no `TBD` or empty cells).
- [ ] RICE Scorecard has all 4 inputs and the computed score. Reach uses tier values (1/3/5/10). Impact is integer 1–5. Confidence is 20/50/80/100. Effort is ≥0.5.
- [ ] MCP Compatibility Matrix has all 7 rows evaluated. No row is blank.
- [ ] Integration Roadmap has ≥3 concrete steps, each with an exit condition.
- [ ] Recommendation is exactly one of: APPROVE, REVISE, REJECT.
- [ ] If APPROVE or REVISE, the integration roadmap is included.
- [ ] If REJECT, the rejection reason is stated and actionable.

## Side Effects

| Action | Type | Blast Radius | Human Approval? |
|--------|------|-------------|-----------------|
| Read proposal text from user | Read-only | Low | No |
| Elicit missing metadata | Pure | Low | No |
| Compute RICE score (internal) | Pure | Low | No |
| Validate against MCP spec (internal) | Pure | Low | No |
| Generate integration plan (internal) | Pure | Low | No |
| Emit evaluation report to output | Pure | Low | No |
