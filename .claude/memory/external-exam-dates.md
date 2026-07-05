---
name: external-exam-dates
description: 'Where external/other-FK exam dates are set (/exam/external, Semesterdaten entry) and how the two tabs map to the backend'
metadata:
  node_type: memory
  type: project
  originSessionId: c5f57170-c127-4286-8376-33501b96ade2
---

Termine für Prüfungen, die _nicht_ der/die Nutzer:in plant, werden auf **/exam/external** gesetzt (erster Eintrag im Nav-Abschnitt „Terminplanung"). Zwei Tabs, beide terminiert über die Mutation `setExternalExamTime(ancode, date, time)` (API `/api/exam/setExternalExamTime`, date-Format „dd.mm.yyyy"), Termin liegt in `planEntry.externalTime`.

- **MUC.DAI (extern)**: `mucdaiExams` gefiltert auf `plannedBy != 'FK07'`, nach `program` (Studiengang) gruppiert. FK-Badge = `plannedBy`.
- **ZPA (nicht von mir geplant)**: `zpaExamsToPlanWithConstraints` gefiltert auf `constraints.notPlannedByMe`. FK-Badge = `Teacher.fk` via `zpaExam.mainExamerID` (aus `teachers { id fk }`).

Inline Datum/Zeit (kein Popup) über die Komponente `src/lib/exam/ExternalExamRow.svelte`; „kein Termin" wird gelb hervorgehoben. Der volle Umfang der MUC.DAI-Verwaltung (Import, ZPA-Verknüpfung) liegt weiterhin auf `/primuss/mucdai`; /exam/external ist die schlanke, nach Studiengang sortierte Termin-Ansicht.
