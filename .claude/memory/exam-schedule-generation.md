---
name: exam-schedule-generation
description: Where the automatic exam-schedule generator lives (/plan/exams/generate) and how its subscription/report/gate map to the backend
metadata:
  node_type: memory
  type: project
  originSessionId: c5f57170-c127-4286-8376-33501b96ade2
---

Der automatische Terminplan wird auf **/plan/exams/generate** erzeugt (Nav „✨ Terminplan generieren" unter Terminplanung).

- **Subscription** `generateExamSchedule(dryRun: Boolean!, seed: Int, iterations: Int): LogLine!` — gleiche WS-/LogLine-Mechanik wie `assignInvigilations` (siehe `/plan/invigilation/generate`), aber PROGRESS kommt als **Text** (kein `progress`-Objekt) und die RESULT-Zeile trägt **`examReport`** (statt `report`). Zwei Aktionen: „Probelauf" = `dryRun:true` (schreibt nichts, liefert trotzdem `examReport`), „Generieren & schreiben" = `dryRun:false`.
- **Gate**: Steht `EXAMS` in `planningState.blockedAreas` (gesetzt, sobald `draftSent`/`examPlanPublished` gehakt sind, PlanningGate-Enum EXAMS), ist der Schreib-Button gesperrt, Probelauf bleibt erlaubt. Startseiten-Label in `AREA_LABEL` (src/routes/+page.svelte).
- **`examReport` (ExamScheduleReport)**: Qualitäts-Panel — units/placed/fixed/unplaced/unplacedAncodes, hardViolations (soll 0), cost + costByConstraint, iterations/stoppedEarly/written, diagnostics (adjacent/sameDay/nextDay/… inkl. studentsWithAdjacent/studentsWithSameDay, Slot-Auslastung).
- **Read-only Constraints**: Query `examScheduleConstraints { name title description kind weight tier }`, nach `tier` sortiert, nur Anzeige.
- Planning-State-Punkt `examScheduleGenerated` (Phase 1) wird beim Schreiben automatisch gesetzt und erscheint backend-getrieben auf der Startseite.
