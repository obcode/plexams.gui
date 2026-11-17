---
name: portal-routes
description: Examiner portal in the GUI — (planner) route group, src/routes/portal with own layout, portalRequest to /query/portal, form actions instead of /api proxies
metadata:
  type: project
---

Since M1 of the examiner portal (2026-11):

- All planner pages live in `src/routes/(planner)/` (URLs unchanged). Its `+layout.svelte`
  holds Nav, polling and the fetch patch; the root layout keeps only CSS/theme/title.
  Error rendering is shared via `$lib/ErrorPanel.svelte` (`homeHref`).
- `src/routes/portal/` has its own layout (no Nav, no polling, `Cache-Control: no-store`),
  loads `session` via `portalRequest` (`src/lib/server/backend.js`) and never calls `/query`.
- Portal pages use **SvelteKit form actions**, not `/api/...` proxies — deliberate deviation
  from the rest of the GUI: the portal endpoint is the API (also reachable with a personal
  token at `/query/token`), and the planner read-only gate (`READ_POST_PATHS`) stays untouched.
- Backend error codes (`extensions.code`) → German messages in `src/lib/portal/errors.js`;
  dates always via `formatBerlin` (`src/lib/portal/time.js`) — the container has no TZ.
- Portal endpoint URL: `PLEXAMS_PORTAL_SERVER`, else `PLEXAMS_SERVER` with `/query` →
  `/query/portal`.
- Admin side: `(planner)/admin/access` + `api/access/*` (all in `READ_POST_PATHS`).

- M2 (2026-11): `portal/[semester=semester]/exahm-seb` (matcher `src/params/semester.js`),
  `$lib/portal/PreplanForm.svelte`, `$lib/portal/inquiry.js` (labels, `inquiryPath`,
  `preplanInputFromForm`). Planner side: `(planner)/inquiries` (setup + inbox with
  `$lib/inquiry/diff.js`), `(planner)/inquiries/activity`, notification mode on `/account`.
  The planner pages work on the ACTIVE semester; the inbox summary and the activity log span
  all semesters.
- Dev-mode e2e gotcha: in `pnpm dev` a freshly navigated page needs a moment to hydrate;
  a Playwright click before that does nothing. Wait for `networkidle` (plus a short pause).

See [[access-gate]] for who gets where, and `docs/ROUTES.md` for the route map.
