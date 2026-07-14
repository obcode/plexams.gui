---
name: auth-header-forwarding
description: "GUI reicht die Proxy-Identität (X-Remote-User) auf jedem SSR/-api-Hop ans Backend weiter; Deploy-Topologie interner Hop vs. Shibboleth; siehe [[oidc-auth]]"
metadata: 
  node_type: memory
  type: project
  originSessionId: 074d7c4d-379f-452f-b36e-8c9ca5b94d51
---

Seit 2026-07-14 (main) reicht das GUI die vom Auth-Proxy (nginx/Shibboleth) injizierte Identität **selbst** an das Backend weiter. Vorher trug der gui→backend-Hop keinerlei Auth → bei `auth.enabled: true` fail-closed 401 bzw. `me = null`.

**Warum nötig — Deploy-Topologie:** Produktiv ist das Backend Shibboleth-geschützt. Die zwei env-Werte im Deploy:
- `PUBLIC_PLEXAMS_SERVER=https://plexams.cs.hm.edu/query` — läuft im **Browser** (hat das SSO-Cookie, WebSocket via [[slot-free-migration]]/Validierung).
- `PLEXAMS_SERVER=http://plexams:8080/query` — **SSR-Hop Container-zu-Container**, an nginx/Shibboleth **vorbei** (dort `expose: 8080`, kein `ports:`). Deshalb kommt der X-Remote-User-Header dort NICHT automatisch → das GUI muss ihn mitschicken.
- Server-zu-Server über die öffentliche HTTPS-URL geht NICHT: Shibboleth bounct den sessionlosen Request zur IdP-HTML-Seite → `graphql-request` `Invalid execution result` (HTML statt JSON). Das war der 500 beim ersten Deploy.

**Wie umgesetzt (`src/lib/server/backend.js`, server-only):**
- `hooks.server.js` liest `x-remote-user` / `x-remote-displayname` aus `event.request.headers` → `event.locals` **und** legt sie via `authContext.run({...}, () => resolve(event))` in einem `AsyncLocalStorage` ab.
- `backendClient(ctx?)` baut einen `GraphQLClient` mit `X-Remote-User`-Header aus dem ALS-Store (oder explizitem ctx). `backendRequest(doc, vars)` = Kurzform.
- Über ALS bleibt die `gqlProxy`-Signatur unverändert → die **127 `/api`-Proxys ändern sich nicht**; nur die ~53 direkten `request(env.PLEXAMS_SERVER, …)`-Aufrufe wurden auf `backendRequest(…)` umgestellt (env-Import dort entfernt).
- Nur `X-Remote-User` (E-Mail) ist Pflicht; das Backend löst Name/Rolle über `me` aus der DB-Allowlist auf. `X-Remote-Displayname` optional, `X-Remote-Department` liest das Backend derzeit nicht.
- `backendRequest` ist generisch (`@template [T=any]`) wie das frühere `request<T>`: bei neuen SSR-Calls das Ergebnis-Typargument mitgeben, z. B. `backendRequest<{ studyPrograms: StudyProgram[] }>(gql\`…\`)` — ohne Argument ist `data` `any` (aus einem String-Dokument ist T nicht ableitbar).
- Client-Bundle unverändert (Browser geht weiter über `PUBLIC_PLEXAMS_SERVER`).

Tests: `src/lib/server/backend.test.ts` (Header aus ALS), `gqlProxy.test.ts` angepasst (mockt jetzt `GraphQLClient`).
