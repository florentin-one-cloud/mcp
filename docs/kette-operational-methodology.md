# Kette — Operative Methodik

**Inhalt:** LSTR 6-Stufen-Reasoning-Chain, MCP 2026-07-28 Transport, Cloudflare Workers Deployment, GDPR Art. 28 Compliance, Edge-AI-Prinzipien.
**Stand:** 2026-08-28

---

## 1. Der LSTR 6-Stufen-Metakognitions-Zyklus

Jede nicht-triviale Aufgabe durchläuft diesen deterministischen Zyklus. Kein Schritt ist optional bei ≥2 Komplexitätskriterien.

| Stufe | Tool | Ausgangsbedingung | Ergebnis |
|---|---|---|---|
| 1. Metakognitive Bewertung | `metacognitiveMonitoring` (stage: `knowledge-assessment`) | Immer (MANDATORY FIRST STEP) | Kalibrierte Confidence, Wissensgrenzen, Unsicherheitsbereiche |
| 2. Problemdekomposition | `sequentialthinking` | ≥3 Thoughts, `nextThoughtNeeded: false` | Dekomposition in Sub-Probleme mit Dependency-Graph |
| 3. Multi-Perspektiven-Analyse | `collaborativeReasoning` | ≥2 divergent Personas, ≥1 non-agreeing Contribution | Integrierte Perspektive mit Dissens-Auflösung |
| 4. Evidenzvalidierung | `scientificMethod` + `structuredArgumentation` | Beide: Hypothese geprüft + These/Antithese/Synthese | Validierte Evidenz mit Falsifizierbarkeitskriterien |
| 5. Lösungs-Synthese | `constraintSolver` (nur numerisch) + `structuredArgumentation` (qualitativ) | Alle Constraints geprüft | Ausführbarer Plan mit Exit-Conditions |
| 6. Output-Strukturierung | `metacognitiveMonitoring` (stage: `reflection`) | Gleiche `monitoringId` wie Stufe 1 | Finalisiert Confidence, Reasoning-Record persistiert |

### Complexity Gate

Der Zyklus wird **nur** dann gestartet, wenn mindestens 2 der folgenden Kriterien zutreffen:
1. **Multi-step inference** — kettenhafte Deduktion nötig
2. **Competing constraints** — ≥2 Anforderungen in Spannung
3. **Non-trivial uncertainty** — Domänenwissen < proficient
4. **Material consequence** — Fehler → Produktion/Finanz/Recht/Sicherheit
5. **Explicit user demand** — Nutzer fordert audited reasoning

<2 Kriterien → Chain überspringen, Output mit "framework not warranted" markieren.

## 2. MCP 2026-07-28 Transport-Schicht

Kette implementiert die finale MCP-Spezifikation mit **Streamable HTTP** — vollständig zustandslos.

| Eigenschaft | Konkretisierung |
|---|---|
| Protokollversion | MCP 2026-07-28 |
| Transport | Streamable HTTP (POST `/mcp`) |
| Session | Keine — jeder Request ist self-contained |
| Serialisierung | JSON-RPC 2.0 im Request-Body |
| Error Codes | Standard: -32602 (invalid params), -32603 (internal), -32000 (application) |
| Idempotenz | Jeder Tool-Call ist idempotent (Side-Effects: nur anonymisertes PostHog-Tracking) |
| Cache-Hints | Tools/Capabilities sind Cache-freundlich — Input-Schema ändert sich nicht zwischen Minor-Versionen |

### Zwei Transporte, ein Code-Pfad

```
┌────────────┐     stdio     ┌──────────────────────┐
│ CLI / npx  │──────────────▶│  createServer()      │
│ (Entwickl) │               │  (McpServer kette)   │
└────────────┘               └──────────┬───────────┘
                                        │
┌────────────┐  Streamable HTTP  Cloudflare Workers
│ MCP Client │────────────────▶│  createMcpHandler  │
│ (Cursor,   │                 │  (Agent SDK)       │
│  Claude,   │                 └────────────────────┘
│  Portal)   │
└────────────┘
```

`agent/server.ts` exportiert `createServer()` — dieselbe Instanz wird von stdio (CLI) und vom Cloudflare Worker via `createMcpHandler` bedient.

## 3. Cloudflare Workers Deployment

| Komponente | Konfiguration |
|---|---|
| Worker Name | `kette` (ehemals `florentin-one-mcp`) |
| Compatibility Date | 2026-07-29 |
| Compatibility Flags | `nodejs_compat` |
| Durable Objects | `FlorentinOneMCP` (SQLite-backed State Persistence) |
| Jurisdiktion | EU-only Deployment |
| Observability | Wrangler Logs aktiviert; Invocation-Logs deaktiviert (Datensparsamkeit) |
| Cache | Globaler Cache aktiv für `tools/list` und `initialize` |
| CI/CD Deploy | `.github/workflows/deploy.yml` → `workingDirectory: src/kette` |

### Deployment SLA

| Ereignis | Zeitfenster |
|---|---|
| Main Push → Deploy | ≤10 Min. (Build + Typecheck + E2E Smoke Test + Deploy) |
| Rollback | Worker-Versions-Rollback via Wrangler CLI |
| Downtime (planmäßige Wartung) | 0 — zustandsloses Design erlaubt Canary Releases |

## 4. GDPR Art. 28 Compliance

Kette ist ein Data Processor im Sinne von GDPR Art. 28.

| Maßnahme | Implementierung |
|---|---|
| Vertrags-Grundlage | Data Processing Agreement (DPA) zwischen Florentin One und Auftraggeber MANDATORY für produktive Nutzung |
| Geheimniserhalt | Mitarbeiter-Geheimnisverträge; technischer Zugriff nur auf Need-to-know |
| Daten-Minimierung | Reasoning-Tools speichern keine PII im Request; PostHog nutzt anonymisierte `distinctId=POSTHOG_ANONYMOUS_ID` |
| Datenlöschung | Reasoning-Records (reasoning-records/*.md) sind lokal; Cloudflare Durable Objects halten nur anonymisierte Aggregate |
| Drittlandtransfer | Keiner — Deployment EU-only; LSTR-r MCP Endpunkt ebenfalls EU-Hosting |
| Sub-Processor Liste | Cloudflare, PostHog (EU-Instance) |

**PII-Regel für Tool-Calls:** Jeder Nutzer von Kette MUSST vor dem Start der Chain PII aus `thought`, `content`, und `claim` Feldern strippen. Reasoning-Server loggen Inhalte niemals.

## 5. Edge-AI-Prinzipien

| Prinzip | Kette-Implementierung |
|---|---|
| Lokale Inferenz wo möglich | stdio-Transport: alles auf Nutzer-Maschine; kein Netzwerk-Out außer optionales PostHog |
| Niedrige Latenz | Cloudflare Edge: ~50 ms RTT aus Deutschland; Tools sind pure Logik < 5 ms |
| Skalierbarkeit | Zustandslos → beliebig viele Worker-Instanzen parallel |
| Kosten | Pay-per-Invocation via Worker + Durable Object; keine fixen Modell-Lizenzkosten |
| Determinismus | Gleiches Input → gleiches Output. Kein Sampling-Temperatur in der Reasoning-Logik |
