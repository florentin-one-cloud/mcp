# Kette — Funktionale Anwendungsfälle (DACH-regulierte Domänen)

**Domänen:** Maschinenbau, Medizintechnik, Chemie/Cleantech, Agrarwirtschaft, IKT.
**Mapping:** Jeder Use Case wird zu spezifischen Anforderungen der BMFTR-HTAD-Richtlinie abgeglichen.
**Stand:** 2026-08-28

---

## Cross-Domain-Grundlage

Jeder Use Case ist nach folgendem Schema strukturiert:
- **HTAD-Anforderung:** Welcher Absatz der Richtlinie wird adressiert?
- **Domänenrolle:** Welche Persona führt die Aufgabe aus?
- **Kette-Tool-Chain:** Welche Sequenz der 7 Tools wird verwendet?
- **Output/Ergebnis:** Welches Artefakt verlässt die Wertschöpfungskette?
- **Compliance-Gate:** Welche regulatorische Prüfung findet statt?

---

## 1. Maschinenbau

### Use Case 1.1 — Konformitätsbewertung Maschinenrichtlinie 2006/42/EG

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 2.1 Transparenz & 5.1 Nachvollziehbarkeit (technische Unterlagen) |
| Domänenrolle | Konstrukteur + TÜV-zertifizierter Prüfer |
| Kette-Tool-Chain | `metacognitiveMonitoring` → `sequentialthinking` → `collaborativeReasoning` (Personas: Konstrukteur, TÜV-Prüfer, Maschinenbauer) → `scientificMethod` (Hypothese: "Anlage erfüllt ISO 13849-1 PL d") → `structuredArgumentation` → `constraintSolver` (numerische Performance Level Berechnung) |
| Output | Konformitätsbewertungsbericht mit verlinktem Reasoning-Record je Prüfschritt |
| Compliance-Gate | EU AI Act Klasse I (allgemeine Zwecke) → kein Konformitätsbewertungsverfahren; aber Maschinenrichtlinie verlangt technischen Nachweis → wird über die Tool-Chain erbracht |

### Use Case 1.2 — Predictive Maintenance Wartungsplanung

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 4.1 Interoperabilität (SPS ↔ MES ↔ Reasoning) |
| Domänenrolle | Betriebsleiter, Instandhalter |
| Kette-Tool-Chain | `sequentialthinking` (Sensor-Daten → Fault-Tree) → `scientificMethod` (Hypothese: "Lager L2 fällt in < 500 Betriebsstunden aus") → `constraintSolver` (MTBF + Restnutzungsdauer) → `narrativePlanner` (Wartungs-Ablauf in drei Akten: Shutdown, Austausch, Inbetriebnahme) |
| Output | Wartungsplan mit 3-Akt-Workflow + Ersatzteilbedarf |
| Compliance-Gate | GDPR Art. 22 (automatisierte Entscheidungen): Menschen-In-The-Loop MANDATORY vor finaler Wartungsfreigabe |

---

## 2. Medizintechnik

### Use Case 2.1 — Klinische Bewertung (MDR (EU) 2017/745 Anhang XIV)

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 5.2 Nachvollziehbarkeit klinischer Evidenz |
| Domänenrolle | Klinischer Ingenieur, MDR-Referent, benannte Person |
| Kette-Tool-Chain | `metacognitiveMonitoring` → `structuredArgumentation` (These: "Post-Marketing-Daten belegen Sicherheit PL d" / Antithese: "3 schwerwiegende Vorfälle in Klasse IIa" / Synthese) → `collaborativeReasoning` (Personas: MDR-Referent, Arzt, Patient-Vertreter) → `scientificMethod` (Meta-Analyse der PMCF-Daten) |
| Output | Clinical Evaluation Report (CER) Abschnitt mit verlinktem Reasoning-Trail je Evidenzquelle |
| Compliance-Gate | EU AI Act Klasse IIb → Qualitätsmanagementsystem MANDATORY; Reasoning-Chain dokumentiert, dass keine indirekte Diskriminierung (z. B. Bevölkerungsgruppen) vorliegt (EU AI Act Art. 10 Bias-Prüfung) |

### Use Case 2.2 — Risikomanagement ISO 14971

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 1.1 Transparenz der Risikoanalyse |
| Domänenrolle | Risikomanager, Regulatory Affairs |
| Kette-Tool-Chain | `sequentialthinking` (FMEA → Risiko-Prioritäts-Zahl) → `constraintSolver` (RPN = Schwere × Auftretenswahrscheinlichkeit × Entdeckung) → `structuredArgumentation` (Einwand / Objektion: "Risiko R-42 wird unterschätzt" → Neubewertung) |
| Output | Risikomatrix mit nachvollziehbarer Begründung für jede Risiko-Minderungsmaßnahme |
| Compliance-Gate | ISO 14971:2019 Abs. 5 — jede Risikoakzeptanzentscheidung bedarf Menschen-In-The-Loop; Reasoning-Record ist die Entscheidungsgrundlage, nicht die Entscheidung selbst |

---

## 3. Chemie / Cleantech

### Use Case 3.1 — REACH-Stoffbewertung (EG) Nr. 1907/2006

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 3.2 Datenhoheit (Chemiedaten unterliegen Geschäftsgeheimnissen) |
| Domänenrolle | REACH-Manager, Sachverständiger für Chemikaliensicherheit |
| Kette-Tool-Chain | `metacognitiveMonitoring` → `collaborativeReasoning` (Personas: REACH-Sachverständiger, ECHA-Referent, Betriebsrat) → `scientificMethod` (PBT/vPvB-Kriterien nach Anhang XIII) → `constraintSolver` (DNEL/PNEC Berechnungen) |
| Output | CSR (Chemical Safety Report) Abschnitt mit Begründung für jeden gefährlichen Stoff |
| Compliance-Gate | REACH Art. 14 + EU AI Act Art. 5 (verbotene Praktiken: KEINE geheimen toxikologischen Inferenzen ohne offengelegte Evidenz) |

### Use Case 3.2 — Cleantech Anlagen-Portfolio-Optimierung

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 6.1 Qualifizierung + 4.1 Interoperabilität (Smart Grid) |
| Domänenrolle | Energie-Manager, Nachhaltigkeitsbeauftragter |
| Kette-Tool-Chain | `sequentialthinking` (Portfolio → Einzelanlagen) → `constraintSolver` (Energiekosten, CO₂-Äquivalente, Amortisationszeit = Zielfunktion) → `scientificMethod` (Hypothese: "50 kWp PV + 20 kWh Speicher minimieren Scope-2") → `narrativePlanner` (Investitions-Workflow in 3 Phasen: Planung, Genehmigung, Inbetriebnahme) |
| Output | Optimierter Investitionsfahrplan mit € / tCO₂-Kennzahl |
| Compliance-Gate | BImSchG (Bundes-Immissionsschutzgesetz) Emissions-Grenzen MANDATORY Constraints im Solver |

---

## 4. Agrarwirtschaft

### Use Case 4.1 — Düngemittel-Emissions-Bilanzierung (Düngeverordnung, DüV)

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 2.2 Domänenkompetenz (agrar-spezifisches Wissen: Bodenarten, Klimazone) |
| Domänenrolle | Agrar-Ingenieur, Berater, Landwirt |
| Kette-Tool-Chain | `metacognitiveMonitoring` → `scientificMethod` (Hypothese: "Gabe X kg/ha auf Bodenart Löss bleibt N-Düngeverordnung-konform") → `collaborativeReasoning` (Personas: Landwirt, DUENDE-Berater, Wasserrecht-Behörde) → `constraintSolver` (Nährstoff-Gleichung nach DüV § 5) |
| Output | Düngeplan mit Nmin-Bilanz und Behörden-Nachweis |
| Compliance-Gate | DUENDE-Referenzdatensatz MANDATORY Input; keine Optimierung, die die Auflagen der DüV (Obergrenze kg N/ha) unterschreitet |

---

## 5. IKT

### Use Case 5.1 — SecOps Incident Triage (BSI IT-Grundschutz)

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 1.2 Transparenz (Incident-Reasoning muss auditierbar sein) |
| Domänenrolle | SOC-Analyst, IT-Sicherheitsbeauftragter |
| Kette-Tool-Chain | `metacognitiveMonitoring` → `sequentialthinking` (Triage: Detektion → Kontext → Klassifikation → Eskalation) → `structuredArgumentation` (These: "False Positive" vs. Antithese: "Active Threat mit konkreten IOCs") → `constraintSolver` (BSI Triage Score Berechnung) |
| Output | Triage-Report mit BSI-Grundschutz-Baustein-Referenzen und Eskalationsstufe |
| Compliance-Gate | GDPR Art. 33 Meldepflicht → 72h-Frist im Constraint Solver; alle Schritte persistiert als Audit-Trail |

### Use Case 5.2 — Architektur-Review Microservices (Sicherheitsbewertung)

| Feld | Wert |
|---|---|
| HTAD-Anforderung | 4.1 Interoperabilität + 3.2 Datenhoheit |
| Domänenrolle | Architekt, DevOps-Engineer, IT-Sicherheit |
| Kette-Tool-Chain | `collaborativeReasoning` (Personas: Architekt, Security-Owner, GDPR Data Protection Officer) → `scientificMethod` (Hypothese: "Service A → Service B ohne mTLS ist innerhalb Schutzzone akzeptabel") → `structuredArgumentation` (Einwand DSB: "Personendaten fließen zwischen A und B → TLS 1.3 MANDATORY") |
| Output | Architektur-Review Bericht mit Kopplungs-Grad, Fault-Tolerance-Profil und Security-Maßnahmen |
| Compliance-Gate | GDPR Art. 32 (Vertraulichkeit, Integrität); EuGH Schrems II Drittlandtransfer-Prüfung bei Cloud-Anbietern via `objection` Argument |
