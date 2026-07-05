---
name: ui-design-language
description: Oliver wants the whole app progressively modernized to one consistent look
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2e087d07-23fa-44a3-b6ca-b58331a587eb
---

Oliver wants the entire web app to look modern, sleek and "wie aus einem Guss" (of one piece), modernized **progressively** ("nach und nach") — when you touch/build a page, bring it up to the shared style; don't redesign everything at once.

**Why:** Older pages (written by him) look dated next to the newer ones; he wants visual consistency over time.

**How to apply:** Match the established modern style used in the Aufsichten page (`/zpa/invigilator_requirements`), the email pages (`/email`, `/email/attachments`) and the redesigned NTA area:

- page wrapper `mx-2 mt-4 flex flex-col gap-4`, heading `<h1 class="text-2xl font-semibold">` + a count badge — NOT the old `text-4xl text-center uppercase` banners.
- cards/sections `rounded-lg border border-base-300 bg-base-100 p-4`.
- filters/toolbars in a bordered bar; daisyUI inputs (`input-sm`, `select-sm`, `toggle`, `checkbox-sm`).
- status via daisyUI badges (`badge-success/warning/error/info/ghost/outline`, `badge-sm`) and theme tokens (`text-base-content/60`, `text-success`, `text-error`) — NEVER hard-coded colors like `text-green-900`, `text-blue-900`, `text-red-800`.
- tables `table table-zebra`; keep it tidy and compact.

Done so far: Aufsichten, email area, room planning (`/plan/rooms` now merges old Raumplanung + Geplante Räume into one page with "nach Prüfungen"/"nach Räumen" view tabs; `/plan/plannedRooms` deleted; `/plan/kdprooms` = "Anny-Anforderungen (KDP)"; `/plan/roomRequests`; ExamWithNTAsForRoomPlanning/RoomNamesInSlot modernized), full NTA area (`/nta/all`, `/nta/semester`, `/nta/[mtknr]`, NTACard, NtaTR, NTAForm), exam lists (`/zpa/exams` + ExamCard/ExamTypeCard, `/primuss/exams`), and `/rooms`. Still old-style (candidates when next touched): most other `/exam/*`, `/zpa/*`, `/plan/*` list pages and their `$lib` components.

Active-toggle pattern (reused for NTA + rooms): backend `setXActive(id, active)` (active = !deactivated) → `/api/setXActive` proxy (catches errors via `$lib/gqlError`) → per-row daisyUI `toggle toggle-success` (`checked={!deactivated}`, dims row when inactive) → `invalidateAll()` to refresh. Rooms: `/api/room/setRoomActive`, `setRoomActive(name, active)`, hint "wirkt erst beim nächsten Vorbereiten der Räume-für-Slots". Rooms CRUD DONE: `RoomForm` (`src/lib/room/RoomForm.svelte`, add+edit, name locked on edit) in a modal on `/rooms` ("Neuer Raum" + per-row "Bearbeiten"), via `/api/room/addRoom`/`/api/room/updateRoom` (`RoomInput`; sebSeats/hmebSeats only sent when seb). No delete. `/rooms` table: one "Eigenschaften" badge column + toolbar filters (active-status segmented + property chips, AND), keyed `{#each ... (room.name)}`.
