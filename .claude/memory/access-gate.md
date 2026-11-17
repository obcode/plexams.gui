---
name: access-gate
description: hooks.server.js access gate — staff vs portal vs denied vs unavailable, per-user cache, stale-on-outage; replaces the old fail-open gate
metadata:
  type: project
---

The gate in `src/hooks.server.js` decides per request what a login (X-Remote-User) may
reach. Pure logic in `src/lib/server/accessCheck.js` (tested in `accessCheck.test.js`).
Rewritten 2026-11 for the examiner portal (M1); the original 2026-07 version was fail-open
on backend errors — that is gone.

- Two probes **in parallel, never in one document**: `me { email }` on `/query` and
  `session` on `/query/portal` (`portalProbe` in `backend.js`). `me: User!` is non-null and
  would tear down a combined response; an older backend rejects the unknown field.
- `combine(me, session)` → `staff` | `portal` | `denied` | `unavailable`. Only a 4xx or a
  GraphQL error counts as rejection; 5xx and network errors are "unavailable" (graphql-request
  attaches `.response` to every non-2xx, also to a 500). A 404 from `/query/portal` (portal not
  mounted) is a rejection, so with `portal.enabled: false` everything behaves as before.
- `decide(access, path)`: staff → everything; portal → only `/portal/**` and `/monitoring`,
  `/` redirects (303) to `/portal`, the rest gets the portal-only page/403 JSON; denied →
  "Kein Zutritt"; unavailable → 503 page.
- Cache per login: 30 s, concurrent requests coalesced, max 500 entries. On an outage a
  known login keeps its last result for up to 10 min; a denied login stays denied.
- `locals.access` carries `{access, session}` for the layouts.
- Without X-Remote-User (local dev) the gate does nothing.

**Why:** with portal logins there are two audiences; "let through on doubt" is no longer
defined, and a backend restart must not lock anyone out.
