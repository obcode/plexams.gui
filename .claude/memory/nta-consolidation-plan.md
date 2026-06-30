---
name: nta-consolidation-plan
description: NTA area consolidated into 2 pages (DONE 2026-06-21) — structure + key facts
metadata:
  node_type: memory
  type: project
  originSessionId: 2e087d07-23fa-44a3-b6ca-b58331a587eb
---

DONE 2026-06-21: NTA area consolidated from 4 pages to **2** (+ kept `/nta/[mtknr=string]` detail). Routes now: `/nta/all` (Stammdaten), `/nta/semester` (Semester-Sicht), `/nta/[mtknr=string]` (detail). Nav has two NTA entries. Backend mutations `addNTA`/`updateNTA`/`setNTAActive(mtknr,active)` all exist; `NTA.exams`/`NTAExam` were removed backend-side and from all GUI queries + schema.graphql.

Implementation: `/nta/all` = master table + filters (incl. active/inactive) + "NTA hinzufügen" modal + per-row edit (shared `src/lib/nta/NTAForm.svelte`, mtknr locked on edit) + per-row active toggle (`NtaTR` dispatches edit/toggle). Mutations via `/api/addNTA`, `/api/updateNTA`, `/api/setNTAActive` proxies (each catches GraphQL errors -> `{error}` 400 via `src/lib/gqlError.js`; duplicate-mtknr / not-found shown in UI). List refresh via `invalidateAll`. `/nta/semester` = tab toggle `?view=students|exams`, loads only the active view server-side (students view is N+1-heavy: per reg fetches generatedExam+plannedRoomForStudent+plannedExam+invigilator). Toggle deactivation only takes effect at next prepare/generation (noted in UI). NTACard uses the enriched per-student `exams` (built in load), NOT NTA.exams.
