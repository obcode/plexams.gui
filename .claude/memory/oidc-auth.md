---
name: oidc-auth
description: "OIDC-Auth-Anbindung (Identität/Rolle/VIEWER-Ausblendung/Benutzerverwaltung) — am 2026-07-11 nach main gemergt; siehe [[account-page]]"
metadata: 
  node_type: memory
  type: project
  originSessionId: cc7faf72-0766-40ec-a16b-52424f177892
---

Anbindung an Backend `feat/oidc-auth`. Am 2026-07-11 nach **main gemergt & gepusht** (Commit 27adf69 + Doku-Commit ab97086).

- `+layout.server.ts` fragt `me { email name role }` in eigenem try/catch → landet in `page.data.me`. Backend ohne Auth (lokal/Dev) → `me = null` = voller Zugriff, GUI unverändert.
- `src/lib/auth.js`: Rollen-Helfer `isViewer/isAdmin/roleOf/displayName`, `ROLES`-Konstante. + `auth.test.js`.
- Rolle **VIEWER = nur lesen**: [[WriteButton]] (`src/lib/WriteButton.svelte`, zentral für ~33 Schreibstellen) blendet Buttons für VIEWER komplett aus; Nav zeigt Identitäts-Chip + VIEWER-Banner und blendet Semester-Schutz/Workspace aus. **Rein kosmetisch — Enforcement macht das Backend** (VIEWER-Write → „forbidden: your role is read-only").
- **Benutzerverwaltung** `/admin/users` (nur ADMIN-Link im Chip): `users`-Query + `setUser`/`removeUser` über `api/admin/{setUser,removeUser}`. In `hooks.server.js` vom Read-only-Riegel ausgenommen (global, nicht semesterbezogen).

**Wichtig:** Genaue GraphQL-Typen der Admin-Mutationen (Role-Enum vs. String, `removeUser`-Rückgabe) sind Annahmen — beim Deploy des Auth-Backends per `pnpm run update-schema.graphql` abgleichen.
