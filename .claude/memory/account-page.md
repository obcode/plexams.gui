---
name: ""
metadata: 
  node_type: memory
  originSessionId: 91b087b0-c466-477e-bcd7-908a196c8be0
---

„Mein Account"-Seite `/account` (verlinkt im Identitäts-Dropdown von [[oidc-auth]] in `Nav.svelte`, sichtbar sobald ein Konto vorliegt — nicht im Workflow-Menü, wie `/admin/users`).

- **Load** `account/+page.server.ts`: `myAccount { email name role shortname shortnameFromZpa jiraTokenSet jiraTokenUpdatedAt }` in try/catch → `available:false` + `loadError` bei Backend ohne Auth (dann freundlicher Fallback statt Crash).
- **email/name/role** read-only aus dem IdP. **Kürzel**: Feld vorbefüllt mit `shortname` (Backend-Default = `shortnameFromZpa`); speichern `setMyShortname(shortname)`, „Auf ZPA zurücksetzen" = `setMyShortname("")`.
- **Jira-PAT** write-only: `setMyJiraToken(token)` (Passwort-Input, nie Klartext zeigen), Status nur aus `jiraTokenSet`+`jiraTokenUpdatedAt`, `removeMyJiraToken`. „Verbindung testen" ruft den bestehenden `GET /api/jira/connection` (nutzt jetzt das eigene PAT).
- **api/account/** Proxys (`setShortname`, `setJiraToken`, `removeJiraToken`) über `gqlProxy`; in `hooks.server.js` `READ_POST_PATHS` (global, nicht semesterbezogen → Read-only-Riegel blockiert sie nicht).

**Wichtig:** `myAccount` + die 3 Mutationen stehen **noch nicht in `schema.graphql`** (Backend-Feature in Arbeit). Rückgabe-Selektionen (`setMy*` → MyAccount, nicht Boolean) sind Annahmen — nach Deploy per `pnpm run update-schema.graphql` abgleichen; Seite lädt nach jeder Mutation per `invalidateAll` neu.
