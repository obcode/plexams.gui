---
name: exam-schedule-generation
description: Where the automatic exam-schedule generator lives (/plan/exams/generate) and how its subscription/report/gate map to the backend
metadata:
  node_type: memory
  type: project
  originSessionId: c5f57170-c127-4286-8376-33501b96ade2
---

Zweistufig (beide unter Terminplanung, Phase 1):

**Phase A — /plan/exams/roomsphase** (Nav „🏗️ EXaHM/SEB in T-Bau (Phase A)"): Subscription `generateExamRoomsPhase(dryRun, seed, iterations)` (gleiche LogLine/ExamScheduleReport-Mechanik; examReport.unplacedAncodes = SEB-Prüfungen, die nicht in den T-Bau passten). Danach fixieren: `fixExamRoomsPhase` (Int! = Anzahl) / `unfixExamRoomsPhase` (Boolean!, lässt manuelles Locked unangetastet) via /api-Proxies. Setzt Planning-State `exahmSebPlanned`/`exahmSebFixed` (Phase 1). `PlanEntry.phaseFixed` (Boolean!) unterscheidet in der Plan-Ansicht die Raumphasen-Fixierung (🏗️) vom manuellen Locked (🔒) — beide unabhängig in `SlotExam.svelte`; Grid-Datenquelle ist `/api/examsInSlot` (dort + im /plan/exams-Load abgefragt).

**Phase B — /plan/exams/generate** (Nav „✨ Terminplan generieren"): der eigentliche Terminplan; respektiert PhaseFixed automatisch.

- **Subscription** `generateExamSchedule(dryRun: Boolean!, seed: Int, iterations: Int): LogLine!` — gleiche WS-/LogLine-Mechanik wie `assignInvigilations` (siehe `/plan/invigilation/generate`), aber PROGRESS kommt als **Text** (kein `progress`-Objekt) und die RESULT-Zeile trägt **`examReport`** (statt `report`). Zwei Aktionen: „Probelauf" = `dryRun:true` (schreibt nichts, liefert trotzdem `examReport`), „Generieren & schreiben" = `dryRun:false`.
- **Gate**: Steht `EXAMS` in `planningState.blockedAreas` (gesetzt, sobald `draftSent`/`examPlanPublished` gehakt sind, PlanningGate-Enum EXAMS), ist der Schreib-Button gesperrt, Probelauf bleibt erlaubt. Startseiten-Label in `AREA_LABEL` (src/routes/+page.svelte).
- **`examReport` (ExamScheduleReport)**: Qualitäts-Panel — units/placed/fixed/unplaced/unplacedAncodes, hardViolations (soll 0), cost + costByConstraint, iterations/stoppedEarly/written, diagnostics (adjacent/sameDay/nextDay/… inkl. studentsWithAdjacent/studentsWithSameDay, Slot-Auslastung).
- **Read-only Constraints**: Query `examScheduleConstraints { name title description kind weight tier }`, nach `tier` sortiert, nur Anzeige.
- **Konflikt-Loop** (Komponente `src/lib/exam/ExamConflictsPanel.svelte`): Quelle nach einem Lauf `examReport.conflicts` (auch Probelauf), sonst `examScheduleConflicts` aus dem Load. Konflikt-Felder: `ancode/module/mainExamer/groups/isRepeaterExam` je Prüfung, `slot1/slot2 { dayNumber slotNumber starttime }`, `studentCount`, `proximity` (nur SAME_SLOT/ADJACENT/SAME_DAY — kein NEXT_DAY; Folgetag nur im Qualitäts-Panel), `canShareSlot`, `infoOnly` (beide extern → eigener Info-Abschnitt, nichts änderbar), `affectedStudents { mtknr name program group autoAccepted decision accepted }`. **Bewertung ist per-Studierendem** (kein Pair-Rating mehr): `setStudentConflictDecision(a,b,mtknr, decision: ACCEPT|VETO)` / `removeStudentConflictDecision`; Enum `ConflictDecision {ACCEPT,VETO}`. `autoAccepted` (Wiederholer) = automatisch akzeptiert, per VETO aufhebbar; `accepted` = effektiv (ACCEPT oder auto-ohne-Veto). Alle: `studentConflictDecisions { ancode1 ancode2 mtknr decision }`. canShareSlot (Parallelsektionen, nur bei Fehlanmeldung sinnvoll) via `canShareSlotSuggestions`→`setExamsCanShareSlot`, Liste `examsCanShareSlot`, `removeExamsCanShareSlot`. API-Proxies unter /api/. Diff (weg/geblieben/neu) vergleicht die Konfliktliste vor/nach dem Schreiblauf im Client (optimistischer Patch, da examReport-Snapshot).
- Planning-State-Punkt `examScheduleGenerated` (Phase 1) wird beim Schreiben automatisch gesetzt und erscheint backend-getrieben auf der Startseite.
