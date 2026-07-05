---
name: source-structure
description: How src/ is organized vs the NavBar; docs/ROUTES.md is the Nav→route→lib→api index; api endpoints are grouped by domain
metadata:
  type: reference
---

The **NavBar groups by workflow phase** (Vorbereitung → Terminplanung → Raumplanung → Aufsichtenplanung → E-Mails → Semesterdaten → Stammdaten), but **`src/routes/`, `src/lib/`, and `src/routes/api/` all group by domain** (`exam/`, `room/`, `nta/`, `slot/`, `preplan/`, `invigilator/`, `primuss/`, `semester/`, `email/`, `studyprogram/`, `zpa`, `log/`). These two axes differ on purpose.

**[docs/ROUTES.md](../../docs/ROUTES.md)** is the authoritative index: every NavBar entry → page route → lib domain → api domain, plus the `api/` domain-folder catalog. Consult it to jump from a menu item to its source. The menu order/labels live in the `menus` array in `src/lib/Nav.svelte`.

Finding sources:
- **Page:** the NavBar `href` _is_ the folder — `/plan/exams/generate` → `src/routes/plan/exams/generate/`.
- **Endpoint:** `/api/…` is domain-grouped — `fetch('/api/nta/setNTAActive')` → `src/routes/api/nta/setNTAActive/`. **New endpoints go in `api/<domain>/`, never flat under `api/`.** Kept nested-as-is: `api/plan/` (11 read-lookups for the plan grid) and `api/zpaexams/`.
- When renaming a read-only-safe POST proxy, update the `READ_POST_PATHS` allowlist in `src/hooks.server.js` too. See [[validation-write-lock]].

Two pages moved out of the overloaded `plan/` into their domain (2026-07-05), old URLs `308`-redirect: `/plan/external`→`/exam/external`, `/plan/annyBookings`→`/rooms/annyBookings`. See [[external-exam-dates]] and the [[refactor-roadmap]] entry "Quellstruktur: /api nach Domäne gruppiert".
