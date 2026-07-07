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

**Step 3 (done in GUI, 2026-07-07 — "D1+D2"):** the whole planning surface (Terminplan, Räume, Aufsichten) went time-based. The 5 output types **PlanEntry / PlannedRoom / UnplacedExam / BlockedRoom / PrePlannedInvigilation lost day/slot — only `starttime` remains**. Slot queries/mutations renamed to `*At(starttime)` / `*AtTimes(starttimes:[Time!])`: examsAt, preExamsAt, plannedRoomNamesAt, roomsAt, roomsWithFreeSeatsAt, roomsWithInvigilationsAt, invigilator(room,starttime), invigilatorsForDay(date:Time!), blockRoomAt/unblockRoomAt/blockRoomAtTimes/unblockRoomAtTimes, prePlanInvigilation(starttime)/removePrePlannedInvigilation(starttime)/prePlanInvigilationAt. `SlotInput` dropped; `RoomsForSlot` gained starttime (kept day/slot). Internal `/api/**` route paths were kept stable (only the GraphQL inside + request bodies changed). New helper **[$lib/slot/derive.ts]** (`dayNumberForTime`/`slotNumberForTime`/`inPeriod`, tested) derives grid day/slot from a starttime; clients build the absolute starttime via `combineStarttime(day.date, time.start, day.date)`.

**Still slot-based (untouched):** the `Slot` type (allowedSlots/awkwardSlots, `SemesterConfig.slots`/`mucDaiSlots`, conflict slot1/slot2), `Invigilation.slot`, preplan (`preplanExams.plannedDay/SlotNumber`, `preplanOverview.slots`, `setPreplanExamSlot`), and `roomsForSlots` (plural). Don't rename those. `ExamScheduleDiagnostics` stays slot-based too.

**Timezone assumption:** derivation/`combineStarttime` treat Time strings as carrying the backend's local (Berlin) offset — HH:MM is read literally from the ISO string (as `minutesOfDay` already did). If the backend ever emits UTC `Z` times, slot-number derivation would mismatch; verify against a live backend.

`schema.graphql` was hand-edited to match (backend was unreachable); re-run `pnpm run update-schema.graphql` once the backend is reachable to reconcile. See [[exam-schedule-generation]], [[refactor-roadmap]].
