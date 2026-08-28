# Kette — Strategisches Framework

**Kontext:** HTAD-Alignment, Technologische Souveränität, Domänenspezifische Differenzierung, das Blaupause-Transfer-Konzept.
**Stand:** 2026-08-28

---

## 1. HTAD-Alignment-Matrix

Die BMFTR-HTAD-Richtlinie "KI in Wertschöpfungsketten" (Juli 2026) definiert sechs Handlungsfelder. Kette adressiert jedes Feld mit einer konkreten Kapazität:

| HTAD-Handlungsfeld | Kette-Kapazität | Verknüpftes Tool |
|---|---|---|
| 1. Transparente KI | Audit-Trail via Reasoning-Records (jeder Schritt persistiert) | `metacognitiveMonitoring` + `sequentialthinking` |
| 2. Domänenkompetenz | Vertikale Anpassung an DACH-Regularien pro Use-Case-Domäne | `collaborativeReasoning` mit domänenspez. Personas |
| 3. Datenhoheit | Lokale First-Speicherung, GDPR Art. 28 Data-Processor-Vertrag | `constraintSolver` + DSGVO-Constraints |
| 4. Interoperabilität | MCP 2026-07-28 Standard (Streamable HTTP, zustandslos) | Alle Tools via einheitlichem `McpServer` |
| 5. Nachvollziehbarkeit | Evidenzbasierte `scientificMethod` + Dialektik-Synthese | `scientificMethod` + `structuredArgumentation` |
| 6. Qualifizierung | Skill-Ökosystem für KI-Entwickler (LSTR Solo Harness) | Alle Tools via metakognitiven Zyklus |

## 2. Technologische Souveränität

**Strategisches Ziel:** Kein Abhängigkeitsverhältnis zu proprietären Cloud-Plattformen außerhalb der EU. Kette implementiert dies auf drei Ebenen:

| Ebene | Maßnahme | Konkretisierung |
|---|---|---|
| Infrastruktur | Cloudflare Workers, EU-Jurisdiktion | Deploy in EU-Rechenzentren; `wrangler.jsonc` bindet an worker.dev mit EU-Routing |
| Transport | MCP 2026-07-28 (offener Standard) | Kein proprietäres Protokoll; kompatibel mit Cursor, Claude Desktop, beliebigen MCP-Clients |
| Runtime | Optionaler "offline" Modus via stdio | `npx kette` startet den Server lokal ohne HTTP-Ausgang |

**Redundanz:** Die stdio-Transport-Schicht ist die Fallback-Ebene. Falls Cloudflare ausfällt, läuft Kette auf jedem Node.js 22-System via `npx @florentin-one/kette`. Die SLA für das reasoning-Interface hängt nicht von einer einzelnen Infrastruktur ab.

## 3. Domänenspezifische Differenzierungsstrategie

Kette differenziert sich NICHT durch das Grundprinzip "Reasoning via Tools" — das ist heute ein Commodity. Differenzierung entsteht durch:

1. **DACH-spezifisches Compliance-Wissen** (eingebacken in die workspace rules: 00-identity, 10-reasoning, 20-output, 30-compliance)
2. **Branchen-spezifische Persona-Profile** (siehe `docs/kette-use-cases.md` für Maschinenbau, Medizintechnik, Chemie/Cleantech, Agrar, IKT)
3. **HTAD-spezifische Terminologie** und Semantik: "Wertschöpfungskette" ist nicht "Pipeline"; "KI-Entwickler" ist nicht "ML-Engineer"
4. **Deutschsprachige Erstklassigkeit:** Fehlermeldungen, Dokumentation, Compliance-Hinweise in DE + EN, nicht EN-only

## 4. Das "Blaupause"-Transfer-Konzept

Ein zentrales strategisches Konzept der HTAD-Richtlinie ist der Wissenstransfer zwischen Branchen. Kette implementiert dies als **Blaupause-Architektur**:

```
Branchen-Blaupause A (Maschinenbau)
  ├─ Reasoning-Kette (Kette, generisch)
  ├─ Domänen-Personas (Konstrukteur, Betriebsleiter, TÜV-Prüfer)
  ├─ Constraint-Schemata (ISO 13849, Maschinenrichtlinie 2006/42/EG)
  └─ Ethical Guardrails (EU AI Act Risikoklasse → spezifische Tools)

         │  Blaupause-Transfer (kopierbar)
         ▼

Branchen-Blaupause B (Medizintechnik)
  ├─ Reasoning-Kette (identisch mit A)
  ├─ Domänen-Personas (Klinischer Ingenieur, MDR-Referent, Arzt)
  ├─ Constraint-Schemata (MDR (EU) 2017/745, ISO 14971)
  └─ Ethical Guardrails (EU AI Act Klasse III, Klinische Evidenzpflicht)
```

**Kosteneffekt:** Die Reasoning-Schicht selbst wird genau einmal entwickelt (7 Tools + MCP Server). Jede neue Branche fügt nur Personas, Constraint-Schemata und Guardrails hinzu — ein Bruchteil der ursprünglichen Entwicklungskosten.

## 5. Geschäftsmodell-Implikation

Das Blaupause-Konzept definiert das Preismodell:

- **Einmalige Implementierungsgebühr** pro Blaupause (Branchen-spezifische Personalisierung)
- **Nutzungsabhängige Abrechnung** pro Tool-Call (gemessen über PostHog anonymisierte Events)
- **Enterprise-Lizenz** für On-Prem-Deployments mit dedizierter Durable-Object-Instanz
