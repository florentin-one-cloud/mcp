# Rebranding Plan: `mcp` → Strategic Rename Aligned with the German AI Value Chain

## Summary

The repository `florentin-one-cloud/mcp` (npm: `@florentin-one/mcp`) currently carries a generic, protocol-level name. This plan proposes rebranding options that position the product within the **KI-Wertschöpfungskette** (AI value chain) framework defined by the BMFTR's July 2026 HTAD funding directive — specifically as the **reasoning infrastructure layer** connecting KI-Entwickler, Software-Integratoren, and industrielle Endanwender.

---

## 1. Current State Analysis

### 1.1 What the Repository Is

| Dimension | Current State |
| ----------- | -------------- |
| **Repository** | `florentin-one-cloud/mcp` on GitHub |
| **NPM Package** | `@florentin-one/mcp` v1.0.2 |
| **Cloudflare Worker** | `florentin-one-mcp` |
| **Binary** | `florentin-one-mcp` |
| **Production Endpoint** | `https://mcp.florentin-one.de/mcp` |
| **Core Function** | Unified MCP server packaging 7 AI reasoning tools (metacognitiveMonitoring, sequentialthinking, collaborativeReasoning, scientificMethod, structuredArgumentation, constraintSolver, narrativePlanner) |
| **Architecture** | Single Cloudflare Worker, Streamable HTTP (MCP 2026-07-28), stateless, EU-only deployment |
| **Target Audience** | Enterprise AI teams, MCP client developers, DACH-region organizations in regulated domains |

### 1.2 Naming Problem

The name `mcp` is the **protocol acronym** (Model Context Protocol), not a product name. This creates three issues:

1. **Zero semantic differentiation**: Every MCP server repository could be named `mcp`. The name communicates the protocol, not the value.
2. **No positioning signal**: The name does not convey that this is reasoning infrastructure for the AI value chain — it could be any MCP tool.
3. **Missed strategic alignment**: The BMFTR directive explicitly defines a "lückenlose KI-Wertschöpfungskette" (seamless AI value chain) as the funding criterion. The product occupies a specific, valuable position in that chain but the name does not reflect it.

### 1.3 Position in the KI-Wertschöpfungskette

Per the BMFTR directive (§4, "Lückenlose Abbildung der KI-Wertschöpfungskette"):

```
KI-Entwickler ──→ Software-Integratoren ──→ Industrielle Endanwender
     ↑                    ↑                        ↑
     │                    │                        │
  [This product: reasoning infrastructure enabling all three layers]
```

The 7 reasoning tools form the **cognitive middleware** that:

- KI-Entwickler use to build auditable, confidence-calibrated AI systems
- Software-Integratoren embed into domain-specific pipelines (RAG, Knowledge Graphs, Agentic Workflows)
- Industrielle Endanwender consume through MCP-compatible clients with full EU data sovereignty

---

## 2. Naming Criteria (Derived from HTAD Documents)

| # | Criterion | Source | Weight |
| --- | ----------- | -------- | -------- |
| C1 | References the AI value chain or vertical integration concept | BMFTR §4: "lückenlose Abbildung der KI-Wertschöpfungskette" | High |
| C2 | Conveys domain-specific precision, not general-purpose AI | HTAD: "industrielle, domänenspezifische KI" vs. "Allzweck-LLMs" | High |
| C3 | Signals technological sovereignty / EU data sovereignty | HTAD: "technologische Souveränität", GDPR Art. 28 | Medium |
| C4 | Short (≤3 syllables), memorable, pronounceable in DE + EN | General branding | High |
| C5 | Available as npm package name (`@florentin-one/<name>`) | Practical constraint | Hard gate |
| C6 | Distinctive — not a generic protocol or technology term | Differentiation | Medium |
| C7 | Aligns with Florentin One principles: augmentation, systems thinking, outcome over output | florentin-one.md | Medium |

---

## 3. Proposed Names

### 3.1 Tier 1 — Strongest Strategic Fit

#### A. `@florentin-one/kette`

| Criterion | Assessment |
| ----------- | ------------ |
| C1 (value chain) | **Direct reference.** "Kette" = chain. Evokes "Wertschöpfungskette" and the BMFTR's "lückenlose Kette" requirement. |
| C2 (domain-specific) | Implicit — a chain implies linked, specialized links, not a generic blob. |
| C3 (sovereignty) | Neutral. |
| C4 (brevity) | 2 syllables. Excellent. |
| C5 (availability) | Must verify. |
| C6 (distinctiveness) | High. No other AI infrastructure product uses this. |
| C7 (Florentin One) | Aligns with "systems over tools" — a chain is a system, not a standalone tool. |

**Tagline**: *"Das fehlende Glied in Ihrer KI-Wertschöpfungskette."* (The missing link in your AI value chain.)

**Risk**: "Kette" alone may be too abstract without context. Mitigation: always pair with descriptor "Reasoning Infrastructure" in README/subtitle.

#### B. `@florentin-one/vertikal`

| Criterion | Assessment |
| ----------- | ------------ |
| C1 (value chain) | **Strong.** "Vertikal" directly references the BMFTR's core concept of "vertikale Wertschöpfungsketten" and "tiefe vertikale Integration." |
| C2 (domain-specific) | **Strong.** The HTAD repeatedly contrasts "vertikal" (domain-specific) with "horizontal" (Allzweck-LLMs). This name positions the product on the right side of that dichotomy. |
| C3 (sovereignty) | Neutral. |
| C4 (brevity) | 3 syllables. Good. |
| C5 (availability) | Must verify. |
| C6 (distinctiveness) | High in AI context. |
| C7 (Florentin One) | Aligns with depth over breadth. |

**Tagline**: *"Vertikale KI-Infrastruktur für die deutsche Industrie."*

**Risk**: "Vertikal" is a common word in German business. Mitigation: the `@florentin-one` namespace provides sufficient disambiguation.

#### C. `@florentin-one/denkwerk`

| Criterion | Assessment |
| ----------- | ------------ |
| C1 (value chain) | Indirect. "Denkwerk" (thinking work / thought factory) evokes the cognitive engine within the value chain. |
| C2 (domain-specific) | Implicit — a Werk (factory) implies industrial-grade, not consumer-grade. |
| C3 (sovereignty) | Neutral. |
| C4 (brevity) | 2 syllables. Excellent. |
| C5 (availability) | Must verify. |
| C6 (distinctiveness) | High. Evocative German compound word. |
| C7 (Florentin One) | Strong alignment with "augmentation over automation" — Denkwerk augments human thinking. |

**Tagline**: *"Das Denkwerk für industrielle KI-Systeme."*

**Risk**: May be confused with "Denkwerk" co-working spaces or the Denkwerk consulting firm. Mitigation: the `@florentin-one` namespace and "KI" context disambiguate.

### 3.2 Tier 2 — Strong Alternatives

#### D. `@florentin-one/kognition`

| Criterion | Assessment |
| ----------- | ------------ |
| C1 (value chain) | Indirect. Positions as the cognitive layer within the chain. |
| C2 (domain-specific) | Neutral. |
| C3 (sovereignty) | Neutral. |
| C4 (brevity) | 3 syllables. Good. |
| C5 (availability) | Must verify. |
| C6 (distinctiveness) | Medium. "Cognition" is used in AI but less so in product names. |
| C7 (Florentin One) | Aligns with cognitive load reduction focus. |

#### E. `@florentin-one/blaupause`

| Criterion | Assessment |
| ----------- | ------------ |
| C1 (value chain) | **Strong.** "Blaupause" (blueprint) is a central concept in the BMFTR directive — the Transfer-Handbuch is explicitly called a "Blaupause" for the industry. |
| C2 (domain-specific) | Implicit — blueprints are domain-specific by nature. |
| C3 (sovereignty) | Neutral. |
| C4 (brevity) | 2 syllables. Good. |
| C5 (availability) | Must verify. |
| C6 (distinctiveness) | High. |
| C7 (Florentin One) | Aligns with "systems over tools" — a blueprint is a system design, not a tool. |

**Tagline**: *"Die Blaupause für vertrauenswürdige KI-Infrastruktur."*

**Risk**: "Blaupause" implies a template/plan, not a running system. The product is live infrastructure, not a document. Mitigation: position as "die laufende Blaupause" (the living blueprint).

#### F. `@florentin-one/souverän`

| Criterion | Assessment |
| ----------- | ------------ |
| C1 (value chain) | Indirect. |
| C2 (domain-specific) | Neutral. |
| C3 (sovereignty) | **Direct.** "Souverän" = sovereign. References "technologische Souveränität" — a core HTAD goal. Also references EU data sovereignty (GDPR, Edge AI). |
| C4 (brevity) | 2 syllables. Good. |
| C5 (availability) | Must verify. |
| C6 (distinctiveness) | Medium-High. |
| C7 (Florentin One) | Neutral. |

### 3.3 Tier 3 — Niche / Specialized

#### G. `@florentin-one/domäne`

Direct reference to "domänenspezifische KI." Risk: too generic, "Domäne" is a common word.

#### H. `@florentin-one/leitwerk`

"Leitwerk" = guidance system / control surface. Evokes "Leitprojekt" from the BMFTR directive. Aviation connotation suggests precision and control.

#### I. `@florentin-one/gefüge`

"Gefüge" = structure/fabric. Evokes the interconnected nature of the AI value chain. Too abstract for most audiences.

---

## 4. Recommendation

**Primary recommendation: `@florentin-one/kette`**

Rationale:

1. **Maximum strategic alignment** with the BMFTR's "KI-Wertschöpfungskette" — the single most distinctive concept in the HTAD AI funding framework.
2. **Memorable and short** (2 syllables, 5 letters).
3. **Distinctive** — no other AI infrastructure product uses this name.
4. **Narrative power**: "Kette" tells a story — each reasoning tool is a link; together they form the chain that connects KI-Entwickler to Endanwender. The product is the "missing link" that makes the chain complete.
5. **German-language identity**: Signals DACH-market focus and differentiates from US-centric AI branding.

**Secondary recommendation: `@florentin-one/vertikal`**

Rationale:

1. Directly references the HTAD's core dichotomy (vertikal = industriell, domänenspezifisch vs. horizontal = Allzweck-LLMs).
2. Immediately communicates the product's positioning to anyone familiar with the BMFTR directive.
3. Slightly less distinctive than "kette" but more immediately understandable.

---

## 5. Implementation Path

### 5.1 Scope of Rename

| Artifact | Current | Proposed |
| ---------- | --------- | ---------- |
| GitHub repository | `florentin-one-cloud/mcp` | `florentin-one-cloud/kette` |
| NPM package | `@florentin-one/mcp` | `@florentin-one/kette` |
| Cloudflare Worker | `florentin-one-mcp` | `florentin-one-kette` |
| Binary command | `florentin-one-mcp` | `florentin-one-kette` |
| Production endpoint | `https://mcp.florentin-one.de/mcp` | `https://kette.florentin-one.de/mcp` (path preserved for protocol clarity) |
| Beta endpoint | `https://mcp.beta.lstr.one/mcp` | `https://kette.beta.lstr.one/mcp` |

### 5.2 Files Requiring Changes

1. `/package.json` — `name` field
2. `/src/florentin-one-mcp/package.json` — `name`, `description`, `bin`, `keywords`, `homepage`
3. `/src/florentin-one-mcp/wrangler.jsonc` — Worker name
4. `/README.md` — all references
5. `/AGENTS.md` — package references
6. `/CONTRIBUTING.md` — setup instructions
7. `.github/workflows/deploy.yml` — Worker name reference
8. `.trae/mcp.json` — endpoint URL
9. `.trae/rules/00-identity.md` — any package references
10. MCP client configuration examples in README
11. Cloudflare Worker route configuration

### 5.3 Migration Strategy

1. **Phase 1 — New package publication**: Publish `@florentin-one/kette` as a new package (v1.0.0).
2. **Phase 2 — Deprecation notice**: Add deprecation warning to `@florentin-one/mcp` v1.0.x pointing to the new package.
3. **Phase 3 — GitHub rename**: Rename repository (GitHub redirects `mcp` → `kette` automatically).
4. **Phase 4 — Endpoint migration**: Deploy new Worker at `kette.florentin-one.de`, maintain old endpoint with redirect for 6 months.
5. **Phase 5 — Archive**: Archive `@florentin-one/mcp` on npm after migration window.

### 5.4 Communication

- Blog post: "Vom Protokoll zur Wertschöpfung: Warum aus `@florentin-one/mcp` jetzt `@florentin-one/kette` wird"
- Reference the BMFTR directive and HTAD framework as strategic context
- Position the rename as alignment with Germany's industrial AI strategy

---

## 6. Assumptions & Decisions

1. **Assumption**: The npm package name `@florentin-one/kette` is available. Verification required before execution.
2. **Assumption**: The Cloudflare Worker name `florentin-one-kette` is available.
3. **Decision**: The MCP protocol path (`/mcp`) is preserved in endpoints to maintain protocol clarity — the rename applies to the product/brand layer, not the protocol layer.
4. **Decision**: The directory structure `src/florentin-one-mcp/` is renamed to `src/florentin-one-kette/` for consistency.
5. **Decision**: The `@florentin-one` namespace is preserved — the rename is scoped to the package name within the namespace.

---

## 7. Verification

1. `npm search @florentin-one/kette` — confirm availability
2. `wrangler whoami` — confirm Cloudflare account access for Worker rename
3. GitHub repository rename — verify redirect from `mcp` → `kette`
4. `pnpm install @florentin-one/kette` — verify installation
5. `npx @florentin-one/kette` — verify binary execution
6. `curl https://kette.florentin-one.de/mcp` — verify endpoint
7. All CI/CD pipelines pass with new name
8. Existing MCP client configs updated and functional
