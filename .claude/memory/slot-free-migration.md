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

**Pending (later steps)** — Terminplan, Räume (rooms), Aufsichten (invigilation) still use the slot model; derived `SemesterConfig.slots`/`mucDaiSlots` (Slot objects) and the slot grid stay for now. Don't rename those when touching plan/rooms/invigilation.

`schema.graphql` was hand-edited to match (backend was unreachable); re-run `pnpm run update-schema.graphql` once the backend is reachable to reconcile. See [[exam-schedule-generation]], [[refactor-roadmap]].
