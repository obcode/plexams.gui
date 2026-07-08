---
name: slot-free-migration
description: "backend moved from a slot-based to a time-based (slot-free) model; GUI migration COMPLETE (config, Terminplan, Räume, Aufsichten, Preplan, RoomRequests, Validation)"
metadata: 
  node_type: memory
  type: project
  originSessionId: e1615a78-27a3-4756-ba83-10325bc291fa
---

The plexams.go backend was reworked from a slot-based to a **time-based (slot-free)** scheduling model, in incremental steps. **The GUI migration is now COMPLETE** (steps 1–4 below).

**Step 4 (done in GUI, 2026-07-07 — "D-Rest"):** the `Slot` type lost `dayNumber`/`slotNumber` — **only `starttime: Time!` remains**. Every consumer now derives day/slot locally from starttime via [$lib/slot/derive.ts] or renders straight from the time: `semesterConfig.slots`/`mucDaiSlots`/`forbiddenSlots`, `allowedSlots`/`awkwardSlots`, `Invigilation.slot` (InvigilatorDays/TR, invigilation/planning), conflict `slot1`/`slot2` (ExamConflictsPanel `fmtSlot` uses starttime). Also: Preplan (`setPreplanExamSlot`→`setPreplanExamTime(id, starttime)`, `PreplanExam.plannedDay/SlotNumber`→`plannedStarttime`, `PreplanSlotNeed`→starttime only; the /preplan slot dropdown/calendar/assignment key by starttime). RoomRequests (`RoomRequest`/`RoomRequestPreview` day/slot→`starttime`; `addRoomRequest`/`setRoomRequestApproved`/`setRoomRequestActive`/`updateRoomRequestTime` take `starttime`; day/slot only derived for display). ValidationFinding day/slot→`starttime` (ValidatorCard shows the formatted time). `api/preplan/setPreplanExamSlot` folder renamed to `setPreplanExamTime`. Grid rendering: columns from `semesterConfig.days[].date`, rows from `starttimes[].start`. _(`ExamDay.number`/`Starttime.number` were still present here; step 5 below removed them — day/slot number is now the array position.)_

**Step 5 (done in GUI, 2026-07-08):** the last integer coordinates were dropped. **`ExamDay` lost `number`, `Starttime` lost `number`** (only `date`/`start` remain), and **`RoomsForSlot` lost `day`/`slot` — only `starttime`+`rooms` remain**. [$lib/slot/derive.ts] `dayNumberForTime`/`slotNumberForTime` now return the **1-based array position (index+1)**, not a field. All ~13 `days { number date }`/`starttimes { number start }` selections dropped `number`; where downstream code still keys/compares by an integer day/slot number (grid keys, DOM anchors, `excludedDays`/`examDays` arrays, config `#N` badge), the load **reconstructs `number: i+1`** on the arrays so consumers are untouched. `roomsForSlots` query → `{ starttime rooms }`, day/slot derived locally (plan/exams, plan/kdprooms). Visible labels are now date (`mkDateShort(date)`) / time (HH:MM) — **no more „Tag N"/„Slot N"** in the planning grids (config setup keeps its #N day badges). `ExamScheduleDiagnostics` field renames (sameSlot→overlaps, adjacent→tooClose, studentsWithAdjacent→studentsWithTooClose, maxSlotSeats→maxSeatsAt, slotsUsed→starttimesUsed, maxExamsPerSlot→maxExamsAt) were already consumed by /plan/exams/generate; validation findings already carry `starttime`.

**Nothing slot-based remains.** `ExamScheduleDiagnostics` KPIs are starttime/position-based; every type is time-only.

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

_(As of step 3 the Slot type / preplan / roomRequests were still slot-based; **step 4 below migrated all of them** — this paragraph is kept only for history.)_

**Timezone assumption:** derivation/`combineStarttime` treat Time strings as carrying the backend's local (Berlin) offset — HH:MM is read literally from the ISO string (as `minutesOfDay` already did). If the backend ever emits UTC `Z` times, slot-number derivation would mismatch; verify against a live backend.

`schema.graphql` was hand-edited to match (backend was unreachable); re-run `pnpm run update-schema.graphql` once the backend is reachable to reconcile. See [[exam-schedule-generation]], [[refactor-roadmap]].
