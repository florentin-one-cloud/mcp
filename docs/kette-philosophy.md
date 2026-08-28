# Kette — Leitphilosophien

**Prinzipien:** Augmentation über Automation, Systeme über Tools, Outcome über Output, Verantwortung ist operational, Problem-First-Ansatz.
**Stand:** 2026-08-28

---

## 1. Augmentation über Automation

> Kette ersetzt keine Menschen. Kette stärkt ihre kognitiven Kapazitäten.

| Automation (falsch) | Augmentation (richtig) |
|---|---|
| "KI entscheidet über Kreditwürdigkeit" | "KI strukturiert die Unterlagen + kalibriert die Unsicherheit; Sachbearbeiter entscheidet" |
| End-to-End Black Box | White-Box Tool-Chain, jeder Schritt auditierbar |
| Hohe Autonomie, geringe Erklärbarkeit | Geringe Autonomie, vollständige Erklärbarkeit |
| Ziel: Mensch aus dem Loop entfernen | Ziel: Mensch *befähigen*, komplexere Fälle zu lösen |

**Konkrete Auswirkung auf die Tool-Design:**
- `constraintSolver` prüft Constraints, liefert aber keine Empfehlung.
- `scientificMethod` validiert Hypothesen, adoptiert sie aber nicht als "Wahrheit".
- `structuredArgumentation` synthetisiert, aber die final synthetisierte Position ist eine Option, nicht ein Befehl.
- Kein Tool gibt je eine "Entscheidung" aus. Jedes Tool gibt *Struktur und Evidenz* für eine Entscheidung aus.

## 2. Systeme über Tools

> Ein isoliertes Tool liefert keinen Mehrwert. Nur das Zusammenspiel im System schafft Wertschöpfung.

Einzelne Tools (z. B. `sequentialthinking` allein) sind Commodity. Das Differenzierungsmerkmal ist:

1. **Der 6-Stufen-Zyklus** erzwingt die Reihenfolge → keine Übersprünge.
2. **Der Reasoning-Record** persistiert das gesamte Zusammenspiel → Auditierbarkeit.
3. **Die Tool-Interaktion** (z. B. Ergebnis von `scientificMethod` fließt als Prämisse in `structuredArgumentation`) → Kettendenken.
4. **Skill-Ökosystem** (LSTR Solo Harness) verwendet Kette als System, nicht als Sammlung.

**Konsequenz:** Neues Tool wird NUR hinzugefügt, wenn es eine definierte Position im 6-Stufen-Zyklus einnimmt. Kein "random neues Tool".

## 3. Outcome über Output

| Output (flach) | Outcome (tief) |
|---|---|
| JSON vom Tool | Der Nutzer hat dank der Struktur die richtige Entscheidung getroffen |
| Confidence-Wert als Zahl | Die Confidence ist kalibriert und im Audit-Trail nachvollziehbar |
| 100 Zeilen Synthese | Die Synthese führt zu regulatorisch konformem Handeln |

**Messbarkeit:** Outcome wird über den Reasoning-Record gemessen, nicht über einzelne Tool-Antworten:
- Konnten 80 % der Schritte nach 6 Monaten noch nachvollzogen werden?
- Fand die final getroffene Entscheidung Menschen-In-The-Loop statt?
- Ist der Reasoning-Record für einen Domänenfremden (z. B. BGH-Saal) verständlich?

## 4. Verantwortung ist operational

> "Wir sind verantwortlich" ist keine Aussage. Verantwortung ist operationalisiertes Verhalten.

Sieben Mechanismen machen Verantwortung greifbar:

1. **Workspace Rules 00–40** sind unveränderbar während einer Aufgabendurchführung.
2. **PreToolUse Hook** blockiert jeden Call, der Secrets/PII in Tool-Argumente platzieren würde.
3. **Reasoning-Record** wird geschrieben, BEVOR die Antwort an den Nutzer geht.
4. **Verification Gate:** Bevor eine Aufgabe als "fertig" deklariert wird, muss ein deterministischer Checker jeden Checklistenpunkt abhaken.
5. **Self-Test Skill** injiziert Explizite-/Implizite-/Mixed-Fehler und gradded den Output gegen Regel-basierte Grader — kein LLM-as-Judge.
6. **Self-Evolve Skill:** Neue Regeln werden nur ADDITIV eingearbeitet. Keine Destruktion.
7. **Human Oversight:** irreversible / hohe Blast-Radius Aktionen (Deploy, Delete, Finanz-Mutation) MÜSSEN Nutzer-Bestätigung haben.

## 5. Problem-First-Ansatz

**Gefahr:** Wenn du einen Hammer hast, sieht alles wie ein Nagel aus. (Maslow)

**Kette geht umgekehrt:**
1. **Zuerst das Problem verstehen:** Step 1 `metacognitiveMonitoring` evaluiert Wissen und formuliert `uncertaintyAreas`.
2. **Dann das Tool wählen:** Nicht "zwinge Problem in ein Tool-Schema", sondern "Tool-Mix folgt dem Problem".
3. **Zuerst Prüfen, ob Chain nötig:** Complexity Gate — bei <2 Kriterien wird Kette übersprungen, Overhead eingespart.
4. **Evidenz vor Spekulation:** `scientificMethod` zwingt zur Hypothese + Falsifizierbarkeit.

**Verbotene Vorgehensweise (Anti-Pattern):**
1. Tool vor Problem aussuchen
2. LLM als Richter verwenden
3. Confidence runden oder für Präsentation optimieren
4. Qualitative Constraints in `constraintSolver` als Boolean kodieren (→ führt zu fabrizierter "Validierung")
5. Steps überspringen um "schneller zu sein"

---

## Resümee

Alle fünf Philosophien reduzieren sich auf einen Satz:

> Kette ist keine Entscheidungsmaschine. Kette ist eine Entscheidungs**strukturierungs**maschine.

Der Mensch — KI-Entwickler, Integrator, Endanwender — bleibt immer das Subjekt der Entscheidung. Kette ist das Objekt, das die Struktur, die Evidenz, die Dissensauflösung und den Audit-Trail liefert.
