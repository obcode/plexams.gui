# Routen- & Endpunkt-Karte

Diese Datei ist der **Index von der NavBar zur Quelle**. Hintergrund: Die NavBar
gliedert nach **Workflow-Phase** (Vorbereitung → Terminplanung → …), die
Ordnerstruktur unter `src/` gliedert nach **Domäne** (`exam/`, `room/`, `nta/`, …).
Beide Achsen sind bewusst verschieden — diese Tabelle verbindet sie.

Faustregeln:

- **Seite finden:** Die `href` aus der NavBar _ist_ der Ordnerpfad unter der Routengruppe
  `(planner)`, die die URL nicht verändert.
  `/plan/exams/generate` → [`src/routes/(planner)/plan/exams/generate/`](<../src/routes/(planner)/plan/exams/generate/>).
  Außerhalb der Gruppe liegen nur `api/`, `healthz/`, `monitoring/` und das Portal `portal/`.
- **Endpunkt finden:** `/api/…` ist nach Domäne gruppiert (wie `src/lib/`).
  `fetch('/api/nta/setNTAActive')` → [`src/routes/api/nta/setNTAActive/`](../src/routes/api/nta/setNTAActive/).
- **Wiederkehrende Bausteine** einer Domäne liegen in `src/lib/<domäne>/`.

Die maßgebliche Reihenfolge/Beschriftung der Navigation steht im `menus`-Array in
[`src/lib/Nav.svelte`](../src/lib/Nav.svelte).

Die Planungs-Checkliste auf der Startseite verlinkt jede Aufgabe auf die Seite, auf der
sie erledigt wird. Die Zuordnung (Schlüssel der Bedingung → Route, E-Mail-Aufgaben
→ `/email#<emailKey>`) steht in
[`src/lib/semester/conditionLinks.js`](../src/lib/semester/conditionLinks.js). Bei einer
neuen Bedingung im Backend oder einer umbenannten Route dort nachziehen. Der Test daneben
prüft, dass jedes Ziel als Route existiert.

---

## NavBar → Route → lib → api

| NavBar-Menü      | Eintrag                             | Seite (`src/routes/(planner)/…`) | lib (`src/lib/…`)             | api-Domäne                                     |
| ---------------- | ----------------------------------- | -------------------------------- | ----------------------------- | ---------------------------------------------- |
| **Semester**     | Semester-Konfiguration              | `config/`                        | `config/`                     | `api/semester/`                                |
|                  | NTA im Semester                     | `nta/semester/`                  | `nta/`                        | `api/nta/`                                     |
|                  | NTA-Liste einlesen                  | `nta/import/`                    | `nta/`                        | `api/nta/`                                     |
|                  | Studierende                         | `students/`                      | `studentRegs/`                | `api/primuss/`                                 |
|                  | Dozierende & Aufsichten             | `zpa/teacher/`                   | `zpa/`, `invigilator/`        | `api/invigilator/`                             |
|                  | Neues Semester anlegen              | `config/new/`                    | `config/`                     | `api/semester/`                                |
|                  | Studiengänge                        | `studyprograms/`                 | —                             | `api/studyprogram/`                            |
|                  | Räume                               | `rooms/`                         | `room/`                       | `api/room/`                                    |
|                  | NTA-Stammdaten                      | `nta/all/`                       | `nta/`                        | `api/nta/`                                     |
|                  | Dauerhaft keine Aufsicht            | `invigilators/`                  | `invigilator/`                | `api/invigilator/`                             |
| **Vorbereitung** | Abfragen an Prüfende                | `inquiries/`                     | —                             | —                                              |
|                  | Änderungen im Portal                | `inquiries/activity/`            | —                             | —                                              |
|                  | Anny-Buchungen                      | `rooms/annyBookings/`            | `room/`                       | `api/room/`                                    |
|                  | SEB/EXaHM-Vorplanung                | `preplan/`                       | `exam/`, `slot/`              | `api/preplan/`                                 |
|                  | ZPA-Import & Veröffentlichung       | `zpa/publish/`                   | `zpa/`                        | `api/zpaexams/`                                |
|                  | Prüfungen auswählen & Vorgaben      | `exam/examsToPlan/`              | `exam/`, `zpa/`               | `api/exam/`, `api/zpaexams/`                   |
|                  | Prüfende mit zu planenden Prüfungen | `exam/examersToPlan/`            | `exam/`                       | `api/exam/`                                    |
|                  | Zusätzliche Prüfungen               | `zpa/additionalExams/`           | `zpa/`, `exam/`               | `api/exam/`                                    |
|                  | Prüfungen gemeinsamer Studiengänge  | `primuss/joint/`                 | `exam/`                       | `api/exam/`                                    |
|                  | Prüfungslisten aus Primuss          | `primuss/exams/`                 | `studentRegs/`                | `api/primuss/`                                 |
|                  | Zuordnung ZPA ↔ Primuss             | `exam/connected/`                | `exam/`                       | `api/exam/`, `api/primuss/`                    |
|                  | Aufbereitete Prüfungen              | `exam/assembledExams/`           | `assembledExams/`, `exam/`    | `api/exam/`                                    |
| **Termine**      | Prüfungen anderer FKs               | `exam/external/`                 | `exam/`                       | `api/exam/`                                    |
|                  | EXaHM/SEB in T-Bau planen           | `plan/exams/roomsphase/`         | `room/`, `slot/`              | `api/room/`, `api/plan/`                       |
|                  | Terminplan generieren               | `plan/exams/generate/`           | `exam/`, `validation/`        | `api/exam/`, `api/semester/`                   |
|                  | Prüfungsplan                        | `plan/exams/`                    | `slot/`, `exam/`              | `api/slot/`, `api/plan/`                       |
|                  | Prüfungsverteilung / Statistik      | `plan/exams/statistics/`         | `statistics/`                 | —                                              |
|                  | Terminplanung validieren            | `plan/exams/validate/`           | `validation/`                 | —                                              |
| **Räume**        | Raum-Anfragen (Gebäudemanagement)   | `plan/roomRequests/`             | `room/`                       | `api/room/`                                    |
|                  | Räume generieren                    | `plan/rooms/generate/`           | `room/`, `semester/`          | `api/room/`, `api/semester/`                   |
|                  | Raumplanung                         | `plan/rooms/`                    | `room/`, `slot/`              | `api/room/`, `api/plan/`                       |
|                  | Anny-Anforderungen (KDP)            | `plan/kdprooms/`                 | `room/`                       | `api/room/`                                    |
|                  | Räume validieren                    | `plan/rooms/validate/`           | `validation/`                 | —                                              |
| **Aufsichten**   | Aufsichten mit Anforderungen        | `plan/invigilation/planning/`    | `invigilator/`                | `api/invigilator/`, `api/plan/`                |
|                  | Aufsichts-Vorgaben                  | `plan/invigilation/constraints/` | `invigilator/`                | `api/invigilator/`                             |
|                  | Aufsichten einteilen                | `plan/invigilation/generate/`    | `invigilator/`, `validation/` | `api/invigilator/`, `api/semester/`            |
|                  | Aufsichtsplan                       | `plan/invigilation/`             | `invigilator/`                | `api/plan/`                                    |
|                  | Aufsichten validieren               | `plan/invigilation/validate/`    | `validation/`                 | —                                              |
| **E-Mails**      | E-Mails versenden                   | `email/`                         | `email/`                      | `api/email/`                                   |
|                  | E-Mail-Vorlagen                     | `email/templates/`               | `email/`                      | `api/email/`                                   |
|                  | E-Mail-Anhänge                      | `email/attachments/`             | `email/`                      | `api/email/`                                   |
|                  | Special Interests                   | `email/specialInterests/`        | `email/`                      | `api/email/`                                   |
| **Werkzeuge**    | Hilfe                               | `hilfe/`                         | —                             | —                                              |
|                  | Validierung (alle Bereiche)         | `validate/`                      | `validation/`                 | —                                              |
|                  | Downloads & Exporte                 | `download/`                      | `download/`                   | — (REST `/download/*`, kein GraphQL)           |
|                  | Todos                               | `todos/`                         | `todo/`                       | `api/todo/`                                    |
|                  | Jira                                | `jira/`                          | `jira/`                       | `api/jira/` (+ REST `/upload/jira-attachment`) |
|                  | Änderungsprotokoll                  | `log/`                           | —                             | `api/log/`                                     |

Nicht im Menü: die Startseite `/` (Planungs-Checkliste), `plan/invigilation/[day]` (Tagesansicht der Aufsichten), die Detailseiten (`exam/assembledExams/[ancode]`, `todos/[id]`, `nta/[mtknr]`) und das Identitätsmenü (`account/`, `admin/*`).

¹ **2026-07-05 verschoben** aus `plan/`; alte URLs leiten per `308` weiter
(`plan/external/+page.ts`, `plan/annyBookings/+page.ts`).

---

## api-Domänen (`src/routes/api/`)

Alle Mutationen/Proxys sind nach Domäne gruppiert (spiegelt `src/lib/`). Neue
Endpunkte in den passenden Ordner legen — flach unter `api/` **nichts** mehr.

| Ordner              | Endpunkte | Inhalt                                                                                                                                      |
| ------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/exam/`         |        20 | Prüfungs-Constraints/Dauer, aufbereitete Prüfungen (Generieren/Reset), MUC.DAI-Verknüpfung, externe Termine                                 |
| `api/room/`         |        19 | Räume (CRUD), Raum-Anforderungen, Slot-Blockaden, Anny, Raumphasen-Fixierung                                                                |
| `api/preplan/`      |        14 | SEB/EXaHM-Vorplanung (Anlegen, Ancode-Verknüpfung, Constraints, Generierung, Buchungsvorschlag)                                             |
| `api/semester/`     |        10 | Semester wechseln & anlegen, Read-only-Schutz, Config, Planer (setzen/zurücksetzen), Generierungs-Config                                    |
| `api/primuss/`      |        11 | Primuss-Ancodes, StudentRegs (inkl. Einzel-Add/Remove), Studierende, Konflikt-Entscheidungen, Sammellisten-Reset                            |
| `api/nta/`          |         8 | NTA anlegen/ändern/aktiv, Room-Alone-Waiver, NTA-Liste übernehmen/entfernen                                                                 |
| `api/invigilator/`  |         5 | Aufsichts-Vorgaben, permanente Nicht-Aufsichten, Reset                                                                                      |
| `api/slot/`         |         5 | Erlaubte/heikle Slots, Prüfungen im Slot, Terminplan-Reset                                                                                  |
| `api/email/`        |         7 | Anhänge (Liste/Löschen), Special Interests, E-Mail-Vorlagen (Vorschau/Speichern/Zurücksetzen)                                               |
| `api/studyprogram/` |         3 | Studiengänge (Upsert/Delete), Seed aus Config                                                                                               |
| `api/zpaexams/`     |         2 | ZPA-Prüfung in Plan / aus Plan                                                                                                              |
| `api/log/`          |         1 | Mutations-Log                                                                                                                               |
| `api/todo/`         |        12 | Todos: Liste/Labels/Link-Vorschläge (Lesen), Anlegen/Ändern/Erledigen/Löschen, Kommentare, Links, Übernahme aus dem Vorsemester             |
| `api/jira/`         |         7 | Jira: Verbindung/Issue-Detail/offene Issues/Transitions (Lesen), Issue anlegen/kommentieren/Status (Mutation); Anhang per REST-Upload       |
| `api/plan/`         |        11 | **Read-Lookups fürs Plan-Grid** (Slot/Raum/Aufsicht-Abfragen, interaktiv per `fetch`) — bewusst als eigene Gruppe belassen                  |
| `api/access/`       |         6 | Zugang zum Portal (ADMIN): Alias, Sperre, Token-Widerruf, Auflösung einer Kennung — alle in `READ_POST_PATHS`                               |
| `api/inquiry/`      |         5 | Abfragen an Prüfende (aktives Semester): einrichten, öffnen, schließen, Meldung sichten/ablehnen; `markActivitySeen` (in `READ_POST_PATHS`) |

**Hinweis:** Einige POST-Proxys sind in Wahrheit Lese-Abfragen und dürfen auch im
geschützten (read-only) Semester laufen — die Allowlist steht in
[`src/hooks.server.js`](../src/hooks.server.js) (`READ_POST_PATHS`) und muss beim
Umbenennen eines solchen Endpunkts mitgeführt werden.
`api/todo/*` ist dort als Präfix ausgenommen (`READ_ONLY_EXEMPT_PREFIXES`): Todos
ändern keine Planungsdaten und bleiben auch im geschützten Semester bearbeitbar.

---

## Identitäts-Seiten (OIDC-Auth, nicht in der NavBar-Leiste)

Diese Seiten hängen nicht an einem Workflow-Menü, sondern am Identitäts-Dropdown
oben rechts in [`src/lib/Nav.svelte`](../src/lib/Nav.svelte) (nur sichtbar, wenn ein
`me`/Konto vorliegt). Sie sind global (nicht semesterbezogen); ihre Mutations-Proxys
stehen daher in `READ_POST_PATHS` (Semester-Schutz blockiert sie nicht) — die
Zugriffskontrolle macht das Backend.

| Eintrag               | Seite (`src/routes/…`)    | api-Domäne     | Backend                                                                                                                                                                           |
| --------------------- | ------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 👤 Mein Account       | `account/`                | `api/account/` | `myAccount`, `setMyShortname`, `setMyJiraToken`, `removeMyJiraToken`; Jira-Test via `api/jira/connection`                                                                         |
| 🛠️ Überblick          | `admin/overview/` (ADMIN) | —              | `adminOverview` (SSR-Load); Digest-Versand via Subscription `sendAdminDigestNow($dryRun)`                                                                                         |
| 👥 Benutzerverwaltung | `admin/users/` (ADMIN)    | `api/admin/`   | `users`, `setUser`, `removeUser`                                                                                                                                                  |
| 🔑 Zugang zum Portal  | `admin/access/` (ADMIN)   | `api/access/`  | `accessIdentityReport`, `loginAliases`, `portalLoginBlocks`, `rejectedLogins`, `portalAccessTokens`, `accessResolveLogin`; set/remove Alias und Sperre, `revokePortalAccessToken` |

---

## Portal für Prüfende (`src/routes/portal/`)

Eigene Welt neben der Planung: eigenes Layout ohne NavBar und Polling, eigene
Fehlerseite. Spricht **ausschließlich** den Portal-Endpunkt des Backends an
(`/query/portal`, Helfer `portalRequest` in
[`src/lib/server/backend.js`](../src/lib/server/backend.js)) — nie `/query`, und es gibt
keine Portal-Proxys unter `api/`. Eingaben laufen über SvelteKit-Form-Actions. Alles,
was die Oberfläche kann, kann damit auch ein persönliches Token an `/query/token`.

| Seite               | Inhalt                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `portal/`           | Begrüßung, offene Abfragen, Schranke „Sie haben keine Prüfung im zu planenden Semester"       |
| `portal/zugang/`    | Persönliche Tokens: `accessTokens`, Actions `create` (Geheimnis einmal sichtbar) und `revoke` |
| `portal/hilfe/api/` | API-Hilfe: Endpunkt, `curl`-Beispiel, Hinweis für Claude                                      |

Wer hinein darf, entscheidet der Zugangsriegel in
[`src/hooks.server.js`](../src/hooks.server.js) mit
[`src/lib/server/accessCheck.js`](../src/lib/server/accessCheck.js): `me` an `/query` und
`session` an `/query/portal`, parallel. Planungsrolle → alles; nur Portal → nur
`/portal/**` und `/monitoring` (`/` leitet nach `/portal`); sonst „Kein Zutritt". Ein
Backend ohne Portal (404) verhält sich wie vorher.

### Abfragen an Prüfende (Planungsseite)

| NavBar (Vorbereitung)   | Seite                           | api-Domäne     | Backend                                                                                                                          |
| ----------------------- | ------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 📨 Abfragen an Prüfende | `(planner)/inquiries/`          | `api/inquiry/` | `inquiries`, `inquiryInboxSummary`, `inquirySubmissions`; `setInquiry`, `openInquiry`, `closeInquiry`, `reviewInquirySubmission` |
| 🔔 Änderungen im Portal | `(planner)/inquiries/activity/` | `api/inquiry/` | `inquiryActivity` (alle Semester), `myNotificationSetting`, `markInquiryActivitySeen`                                            |

Die Benachrichtigung (sofort, täglich, aus) steht unter „Mein Account" (`api/account/setNotificationMode`).
