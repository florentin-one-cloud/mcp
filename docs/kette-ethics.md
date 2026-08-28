# Kette — Formale Ethische Standards

**Geltungsbereich:** Florentin One Kette.
**Referenzen:** EU AI Act Verordnung (EU) 2024/1689, WeMake Ethik-Richtlinien v2.0, GDPR Datensouveränität, Menschen-In-The-Loop für kritische Entscheidungen.
**Stand:** 2026-08-28

---

## 1. EU AI Act Compliance

### 1.1 Verbotene Praktiken (Art. 5) — ABSOLUTE TABUS

Jede Nutzung von Kette, die eine der folgenden Praktiken impliziert, ist SOFORTIG zu stoppen und dem Compliance-Officer zu melden.

| Art. 5 Absatz | Verbotene Praxis | Wie Kette dies technisch verhindert |
|---|---|---|
| 5.1 (a) | Subtile Manipulation (subliminal, über die Wahrnehmung hinausgehend) | Alle 7 Tools produzieren explizite, auditierbare Texte/Ausgaben. Kein Hidden Prompt-Injection, kein "Steering" über nicht offengelegte Context-Fenster. |
| 5.1 (b) | Ausnutzung vulnerabler Gruppen (Kinder, Behinderte, psychisch Kranke) | `collaborativeReasoning` MUSST bei vulnerablen Gruppen mindestens eine "Advocate"-Persona mit einem Vetorecht enthalten. → `argumentType: "objection"` wenn die Advocate-Persona widerspricht. |
| 5.1 (c) | Soziales Scoring / Ranking von natürlichen Personen | `constraintSolver` akzeptiert KEINE sozialen Score-Variablen. Jede Variable muss eine explizite operationalisierte Messgröße sein. |
| 5.2 | Echtzeit-Biometrische Fernidentifikation am öffentlichen Ort (mit Ausnahmen) | Kette hat KEINE Biometrie-Tools. Jede Integration, die biometrische Daten verarbeitet, muss via DSGVO-Folgenabschätzung (Art. 35) genehmigt werden. |

### 1.2 Risikoklassifizierung

Jeder Kette-Use Case MUSS vor Deployment der Risikoklasse nach EU AI Act zugeordnet werden:

| Risikoklasse | Anforderungen | Beispiele aus Use-Case-Doc |
|---|---|---|
| **Nicht akzeptabel** (Art. 5) | Deployment VERBOTEN | Soziales Scoring, Manipulation, unbefugte Biometrie |
| **Hoch** (Art. 6–52) | QM-System, Technische Dokumentation, Transparenz, Human Oversight, Robustheit, Datenschutz | Klinische Bewertung MDR, SecOps Incident → menschliche Freigabe |
| **Mittel (allgemeine Zwecke)** | Transparenzpflicht, Anbieter-Kodex | Maschinenbau Konformitätsbericht, REACH CSR |
| **Minimal** | Keine Pflichten außerhalb allgemeiner Gesetzgebung | Kreatives Schreiben (`narrativePlanner` für interne Notizen) |

### 1.3 Transparenzpflichten (Art. 50 für general-purpose AI)

Kette als System:
- Jeder Nutzer wird MANDATORY darüber informiert, dass er mit einem KI-System interagiert.
- Jeder Reasoning-Output MÜSSEN einen Verweis auf die 7-Tool-Chain und den zugehörigen Reasoning-Record (wenn vorhanden) tragen.
- Kein Kette-Output darf als "von einem Menschen verfasst" ausgegeben werden, ohne dies offen zu legen.

---

## 2. WeMake Ethik-Richtlinien

WeMake (Plattform für soziale Innovation) formuliert drei unverhandelbaren Prinzipien. Kette implementiert alle drei technisch:

| WeMake Prinzip | Forderung | Kette-Implementierung |
|---|---|---|
| **Mensch und Umwelt vor Profit** | Keine Entscheidung, die Menschen oder Umwelt schädigt, darf allein auf Effizienz oder Kosten basieren | `structuredArgumentation` MUSS in jedem hochrisikobehafteten Use Case mindestens eine `objection` mit der Form "Diese Entscheidung schadet [Mensch X / Umweltaspekt Y] — was ist die Begründung?" enthalten. Diese Einwand MÜSSEN im Final-Output referenziert werden. |
| **Gleichberechtigung / Chancengleichheit** | Benachteiligte Gruppen (Frauen, BIPoC, behinderte Menschen, Niedriglohn) dürfen systematisch nicht benachteiligt werden | `constraintSolver` enthält bei hochriskanten Entscheidungen MANDATORY eine Paritäts-Constraint: "Optimierungslösung darf keine Gruppe um > 20 % schlechter stellen als den Median". Falls Constraint verletzt → Lösung als nicht valide markiert, Begründung via `collaborativeReasoning` mit benachteiligter Advocat-Persona. |
| **Transparenz / Partizipation** | Betroffene haben das Recht, Entscheidungsgrundlagen zu verstehen und Einspruch zu erheben | Der Reasoning-Record ist die maschinenlesbare Transparenz-Grundlage. Ein Einwands-Prozess (Art. 22 GDPR) ist MANDATORY Teil jedes Kette-Integrationsvertrags: Betroffener kann innerhalb 30 Tagen den Record anfordern und eine Neubewertung verlangen. |

---

## 3. GDPR Datensouveränität

| GDPR Artikel | Anforderung | Umsetzung in Kette |
|---|---|---|
| Art. 5 (1)(c) | Datenminimierung | Reasoning-Tools erhalten NUR die Felder, die sie benötigen. PreToolUse Hook prüft dies. |
| Art. 5 (1)(d) | Richtigkeit | Reasoning-Chain führt kontinuierlich `metacognitiveMonitoring` durch → falsche Claims werden als `uncertain` oder `speculation` eingestuft. |
| Art. 12–14 | Transparenzpflicht | Reasoning-Record ist DSGVO-konformes Transparenzdokument (Welche Daten, Welche Logik, Welches Ergebnis, Wer hat verarbeitet). |
| Art. 15 | Auskunftsrecht Betroffener | Reasoning-Records werden lokal in `reasoning-records/` geschrieben — Auskunft in < 72h. |
| Art. 17 | Recht auf Löschung ("Recht auf Vergessenwerden") | Reasoning-Records sind normale Dateien → Löschung ohne Seiteneffekte. Cloudflare Durable Objects halten nur Aggregate → keine personenbezogenen Daten. |
| Art. 22 | Automatisierte Entscheidungen (einschließlich Profiling) | Entscheidungen mit rechtlicher oder ähnlich signifikanter Wirkung MÜSSEN Menschen-In-The-Loop haben. Kette gibt nur Struktur/Evidenz aus, niemals die finale Entscheidung. (Siehe Philosophie § 1 Augmentation) |
| Art. 28 | Auftragsverarbeitung | DPA MANDATORY für jede produktive Nutzung. Kette als Auftragsverarbeiter (Florentin One) dokumentiert Sub-Processor-Liste und erfährt Geheimhaltungspflicht. |
| Art. 32 | Sicherheit der Verarbeitung | TLS 1.3, EU-only Deployment, Least Privilege, PostHog nur anonymisiert, Audit-Logs aller Tool-Calls. |
| Art. 35 | Datenschutz-Folgenabschätzung (DSFA) | Jeder Hochrisiko-EU AI Act Use Case MUSS vor Deployment eine DSFA haben. Der Reasoning-Record der DSFA ist Teil der technischen Dokumentation. |

### Cross-Border Data Egress

Florentin One hat einen **Deutschland-First** Ansatz. Jeglicher Datenfluss in Drittländer außerhalb der EU ist:
1. **Standardmäßig deaktiviert** (EU-only Worker-Jurisdiktion)
2. **Mit Explizitem Opt-In** → Standardvertragsklauseln (SCC) + Impact Assessment
3. **Mit Dokumentation** → jeder Egress-Event ist im Reasoning-Record der betroffenen Task gelistet

---

## 4. Menschen-In-The-Loop (HITL) — Vier Stufen

| Stufe | Bezeichnung | Kriterium | Wer entscheidet final? |
|---|---|---|---|
| **Stufe 1 — Advisory** | Mensch liest Evidenz, Kette liefert Struktur | Alle min. Risk Use Cases | Mensch — ohne zeitlichen Druck |
| **Stufe 2 — Review** | Kette schlägt Aktion vor; Mensch bestätigt in < 10 Min. | Medium Risk Use Cases | Mensch (Review-Frist ≤ 10 Min.) |
| **Stufe 3 — Escalation** | Kette kann blockieren, aber nicht freigeben | Hoch Risk Use Cases (z. B. MedTech) | Nur qualifizierter Mensch (benannte Person / TÜV / Arzt) |
| **Stufe 4 — Gate** | Jegliche Aktion ist blockiert bis 2-Faktor-Mensch-Freigabe | Finanzielle Mutationen > 10.000 € / Deploy auf Produktivsystem / Delete-Operations | Mensch (2FA + Reasoning-Record-Hash) |

HITL ist KEIN Nice-to-have. HITL ist in jedem Glied der Tool-Chain vorgesehen. Der `PreToolUse` Hook erzwingt Stufe 4 per Default für Deployments.

---

## 5. Verstoßescalierung

Bei jedem Verdacht eines Verstoßes (ob Ethik, EU AI Act, GDPR oder WeMake):

1. **Sofortiger Stop** der betroffenen Kette-Instanz (keine weiteren Tool-Calls).
2. **Reasoning-Record-Einfrierung:** Der Audit-Trail wird MANDATORY archiviert, Hash-Wert in SHA-256 persistiert.
3. **Meldung** an Compliance-Officer (Florentin One) < 24h.
4. **Benachrichtigung des Betroffenen** (wenn PII involviert) < 72h gemäß GDPR Art. 33.
5. **Root-Cause-Analyse** unter Verwendung der Kette selbst (Triage → wissenschaftliche Methode → Argumentation) → aber in einer isolierten Instanz, um Kontamination zu vermeiden.
6. **Korrektur-Maßnahmen + Dokumentation** im Reasoning-Record-Evolution-Ledger (Skill: `self-evolve`).
7. **Präventive Maßnahmen** (neue Constraint, neue Workspace Rule, neue Test-Case) werden ADDITIV eingearbeitet — KEINE Destruktion.
