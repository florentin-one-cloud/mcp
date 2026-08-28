# Kette — Grundlagen der KI-Wertschöpfungskette

**Positionierung:** Die reasoning-Infrastruktur-Schicht für die lückenlose KI-Wertschöpfungskette nach BMFTR-HTAD-Richtlinie (Juli 2026).
**Zielgruppe:** KI-Entwickler, Software-Integratoren, industrielle Endanwender im DACH-Raum.
**Stand:** 2026-08-28

---

## 1. Warum "Kette"?

Die BMFTR-Richtlinie "KI in Wertschöpfungsketten" (HTAD, Juli 2026) fordert eine durchgängige Integration von KI-Systemen in industrielle Wertschöpfungsprozesse — von der Datenerfassung über die Wissensverarbeitung bis zur verantwortungsvollen Entscheidungsfindung. Der Name `kette` (Deutsch für "Kette") ist kein zufälliges Branding: er ist die semantische Verankerung des Produkts im regulatorischen und strategischen Kontext der Richtlinie.

Frühere Namen wie `mcp` waren akronymisch, generisch und trugen keine strategische Bedeutung. `kette` ist positionierend: es sagt dem Markt, *welche Rolle* das Produkt einnimmt — das verbindende Glied in der KI-Wertschöpfungskette.

## 2. Position im Ökosystem

```
                ┌──────────────────────────────────────────────┐
                │  KI-Wertschöpfungskette (lückenlos)          │
                ├──────────┬──────────┬───────────┬────────────┤
                │  Daten   │  Wissen  │  Kette    │  Handlung  │
                │  (Input) │ (Verarb)│ (Reasoning)│ (Output)  │
                ├──────────┼──────────┼───────────┼────────────┤
                │  Echtzeit-│ Knowlege│ KETTE     │  MES / ERP │
                │  daten   │  Graphs │ (dieses   │  SPS-Steue-│
                │  Sensorik │ Ontolo- │  Produkt) │  rung /    │
                │  ERP/MES │ gien     │           │  Robotik   │
                └──────────┴──────────┴───────────┴────────────┘
```

Kette ist **nicht** die gesamte Wertschöpfungskette. Kette ist die Reasoning-Schicht: die Instanz, die zwischen Wissensaufbereitung und Handlungsausführung die metakognitive, schrittweise und evidenzbasierte Schlussfolgerung durchführt.

## 3. Die sieben Reasoning-Tools als Kettenglieder

Jedes der sieben Tools entspricht einem funktionalen Glied in der reasoning-Kette. Die Sequenz ist nicht optional — der LSTR 6-Stufen-Metakognitions-Zyklus erzwingt eine Reihenfolge, die jede Schwäche in der Kette einzeln adressiert.

| Kettenglied | Tool | Funktion in der Wertschöpfungskette |
|---|---|---|
| 1 | `metacognitiveMonitoring` | Selbstüberwachung: Wissensgrenzen, Konfidenz, Bias-Identifikation |
| 2 | `sequentialthinking` | Schrittweise Problemlösung mit Revision und Branching |
| 3 | `collaborativeReasoning` | Multi-Persona-Simulation mit strukturierter Dissensauflösung |
| 4 | `scientificMethod` | Formale Hypothesenprüfung, Variablenidentifikation, Evidenz |
| 5 | `structuredArgumentation` | Dialektik: These-Antithese-Synthese |
| 6 | `constraintSolver` | Mathematische Constraint-Prüfung (nur numerisch) |
| 7 | `narrativePlanner` | Drei-Akt-Struktur für narrative Planung |

### Die Kopplungsregel

Kette erzwingt **lose Kopplung** zwischen den Gliedern: jedes Tool ist unabhängig testbar, unabhängig versionierbar und erzeugt eine deterministische Ausgabe bei gegebenem Input. Der `constraintSolver` ist bewusst auf numerische Constraints beschränkt — qualitative, regulatorische oder ethische Constraints werden via `structuredArgumentation` mit `argumentType: "objection"` geprüft.

## 4. Vertikale vs. horizontale KI

| Dimension | Horizontale KI | Vertikale KI (Kette) |
|---|---|---|
| Abstraktionsebene | Domain-unabhängig | Domänenspezifisch (DACH-reguliert) |
| Integrationsaufwand | Niedrig | Hoch + domänenspezifische Schemata |
| Differenzierung | Gering — Copy-Paste verfügbar | Hoch — HTAD-Wissensschemata |
| Haftungsrisiko | Niedrig — generisch | Hoch — aber klar abgegrenzt |
| Strategische Position | Commodity | Kernkompetenz (Blaupause-Transfer) |

Kette positioniert sich als **vertikale KI-Infrastruktur**. Sie ersetzt keine generischen Modelle; sie strukturiert ihre Anwendung entlang der Wertschöpfungskette.

## 5. Referenzen

- BMFTR-HTAD-Richtlinie "KI in Wertschöpfungsketten" (Juli 2026)
- EU AI Act (Verordnung (EU) 2024/1689)
- WeMake Ethics Guidelines (Version 2.0)
- Florentin One V41 Platform — Intelligent Content Understanding (ICU)
