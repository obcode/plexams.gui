---
name: room-generation
description: /plan/rooms/generate runs assignRoomsForExams (now with args) + roomReport panel; mirrors exam-schedule-generation
metadata: 
  node_type: memory
  type: project
  originSessionId: 560877da-c411-4665-be6d-ad8d78d52995
---

Room-planning generation page, built analogous to [[exam-schedule-generation]] (same WS-subscription + terminal + result-panel pattern).

- **Page**: `/plan/rooms/generate` (`+page.svelte` + `+page.server.ts`). Nav: „✨ Räume generieren" under Raumplanung. `/plan/rooms` now links here instead of triggering assignRoomsForExams itself.
- **Subscription**: `assignRoomsForExams(dryRun, seed, iterations, keepAssigned)` — used to be arg-less. Final RESULT LogLine carries `roomReport: RoomPlanReport { placedSeats, unplacedSeats, rooms, cost, costByConstraint, hardViolations, unplacedExams }`. Report has NO seed/written fields → the page tracks seed/writeRun locally.
- **Constraints (read-only)**: new query `roomPlanConstraints: [OptimizerConstraint!]!` (same type as `examScheduleConstraints`).
- **GenerationConfig**: gained room fields `roomHeatMode` (enum AUTO/SUMMER/OFF) + `roomUnplaced/roomBuffer/roomSplit/roomCompaction/roomHeatFloor/roomChurn/roomHeatBaselineHour`. Added to `GENERATION_CONFIG_FIELDS`, `toGenerationConfigInput`, and a new `ROOM_GENERATION_FIELDS` group in `src/lib/semester/generationConfig.ts`. `GenerationConfigFields.svelte` now renders a `<select>` when a field has `options` (previously numeric-only).
- **Room mask**: `Room`/`RoomInput` + RoomForm gained optional `hitzewert: Int` (empty = derive floor/Stockwerk from name). Shown as 🌡 badge in the rooms table.

schema.graphql was updated by hand (backend was ahead of the committed copy) and codegen regenerated. See [[always-commit-push]].
