---
name: slot-free-migration
description: "backend is moving from slot-based to a time-based (slot-free) model; GUI config forms migrated first, Terminplan/Räume/Aufsichten still pending"
metadata: 
  node_type: memory
  type: project
  originSessionId: e1615a78-27a3-4756-ba83-10325bc291fa
---

The plexams.go backend is being reworked from a slot-based to a **time-based (slot-free)** scheduling model, in incremental steps.

**Step 1 (done in GUI, 2026-07-06)** — only the SemesterConfig / GenerationConfig **forms** were adapted to the new GraphQL interface:
- Input `slots: [String!]!` → `startTimes: [String!]!` (label „Anfangszeiten").
- Input/derived MUC.DAI: `mucDaiSlots` (day/slot Int-pairs) & derived `mucDaiSlotsRaw` → `mucDaiAllowedTimes: [Time!]` (absolute datetimes; the SemesterConfigForm matrix now builds a Time per cell from `day.date` + starttime and matches on a minute-key).
- `timelagMin` moved OUT of `GenerationConfig(Input)` INTO SemesterConfig(Input) (+ new `notTooCloseMinutes`); both are optional Ints in the form (defaults 15 / 120).
- The MUC.DAI matrix takes its day columns from backend `semesterConfig.days { number date }` (fetched tolerantly in [/config/+page.server.ts]) instead of computing them from from/until; `/config/new` still computes locally (no backend days for an uncreated semester).

**Step 2 (done in GUI, 2026-07-06)** — placements are now stored as an absolute starttime (day/slot derived, 0 when out-of-period):
- `PlanEntry.externalTime` removed → the time is always in `starttime: Time!`; new `external: Boolean!` flags "planned by another faculty". All readers switched to `starttime` (+ `external` where the flag mattered): SlotExam badge, ExternalExamRow, /primuss/mucdai, otherFkGroups.hasTime, /exam/external — and the query selections (examsInSlot, preExamsInSlot, mucdai, external).
- New mutation `setExamTime(ancode, starttime)` + proxy `/api/exam/setExamTime`. Manual placement lives in the Terminplan (/plan/exams): a "＋ hier" button per slot cell (standard starttime) **and** a free date/time bar with a client-side "keine Standard-Anfangszeit" warning + "trotzdem übernehmen". Helpers in [$lib/exam/setExamTime.ts] (`combineStarttime`, `isStandardStarttime`, `starttimeHHMM`), unit-tested. Backend accepts any time.
- `setExternalExamTime` unchanged. Old `addExamToSlot` was never wired in the GUI.

**Pending (later steps)** — Räume (rooms), Aufsichten (invigilation) still use the slot model; derived `SemesterConfig.slots`/`mucDaiSlots` (Slot objects) and the slot grid stay for now. Don't rename those when touching rooms/invigilation.

`schema.graphql` was hand-edited to match (backend was unreachable); re-run `pnpm run update-schema.graphql` once the backend is reachable to reconcile. See [[exam-schedule-generation]], [[refactor-roadmap]].
