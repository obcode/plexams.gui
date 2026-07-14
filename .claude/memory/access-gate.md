---
name: ""
metadata: 
  node_type: memory
  originSessionId: 430c8551-9ee5-44c4-971d-406bea5cc0aa
---

Seit 2026-07-14 (main, Commit c7a8d7e). Problem davor: eine am Auth-Proxy angemeldete Kennung, deren E-Mail **nicht** in der Backend-Allowlist steht, blieb „drin" — die Nav wurde gerendert, aber jede SSR-`load()` lief ins 401→500 (auf jeder Seite ein Fehler).

**Fix in `src/hooks.server.js`** (Riegel läuft innerhalb `authContext.run`, VOR dem read-only-Riegel):
- `isAuthorized(remoteUser)`: fragt `me { email }` ab, Ergebnis ~30s **pro Kennung** gecacht (`authCache`).
  - Erfolg mit `me.email` → freigeschaltet.
  - Fehler **mit** `err.response` (graphql-request ClientError = Backend hat geantwortet, z. B. forbidden) → **sperren**.
  - Fehler **ohne** `.response` (Netzwerkfehler, Backend down) → **NICHT sperren** (fail-open, niemand aussperren wegen Backend-Hickser).
- Bei Sperre: `denyResponse(event, remoteUser)` — für `/api/*` ein **403-JSON**, sonst eine **eigenständige HTML-Seite** (kein Nav, kein Layout, keine SSR-loads; inline-CSS, light/dark, zeigt die E-Mail). Die Seiten-`load()`s laufen dann gar nicht erst.
- Greift nur wenn `remoteUser` (X-Remote-User-Header) gesetzt ist → lokal/Dev unverändert.

Warum `me` non-nullable relevant ist: `me: User!` im Schema — bei nicht freigeschalteter Kennung kann das Backend nicht `me: null` liefern, sondern wirft → deshalb 500 überall (und deshalb im Layout `me = null` via catch, aber Nav trotzdem da).

Tests: `src/hooks.server.test.js` (mockt `$lib/server/backend`; 5 Fälle: Dev/kein Header, freigeschaltet, abgelehnt HTML, abgelehnt /api-JSON, Backend down = fail-open).
