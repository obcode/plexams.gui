# Routen- & Endpunkt-Karte

Diese Datei ist der **Index von der NavBar zur Quelle**. Hintergrund: Die NavBar
gliedert nach **Workflow-Phase** (Vorbereitung → Terminplanung → …), die
Ordnerstruktur unter `src/` gliedert nach **Domäne** (`exam/`, `room/`, `nta/`, …).
Beide Achsen sind bewusst verschieden — diese Tabelle verbindet sie.

Faustregeln:

- **Seite finden:** Die `href` aus der NavBar _ist_ der Ordnerpfad.
  `/plan/exams/generate` → [`src/routes/plan/exams/generate/`](../src/routes/plan/exams/generate/).
- **Endpunkt finden:** `/api/…` ist nach Domäne gruppiert (wie `src/lib/`).
  `fetch('/api/nta/setNTAActive')` → [`src/routes/api/nta/setNTAActive/`](../src/routes/api/nta/setNTAActive/).
- **Wiederkehrende Bausteine** einer Domäne liegen in `src/lib/<domäne>/`.

Die maßgebliche Reihenfolge/Beschriftung der Navigation steht im `menus`-Array in
[`src/lib/Nav.svelte`](../src/lib/Nav.svelte).

---

## NavBar → Route → lib → api

| NavBar-Menü           | Eintrag                         | Seite (`src/routes/…`)           | lib (`src/lib/…`)             | api-Domäne                          |
| --------------------- | ------------------------------- | -------------------------------- | ----------------------------- | ----------------------------------- |
| **Vorbereitung**      | SEB/EXaHM-Vorplanung            | `preplan/`                       | `exam/`, `slot/`              | `api/preplan/`                      |
|                       | ZPA-Prüfungen planen            | `exam/examsToPlan/`              | `exam/`, `zpa/`               | `api/exam/`, `api/zpaexams/`        |
|                       | Zu planende Prüfende            | `exam/examersToPlan/`            | `exam/`                       | `api/exam/`                         |
|                       | Anmeldungszuordnung             | `exam/connected/`                | `exam/`                       | `api/exam/`, `api/primuss/`         |
|                       | Aufbereitete Prüfungen          | `exam/assembledExams/`           | `assembledExams/`, `exam/`    | `api/exam/`                         |
| **Terminplanung**     | Terminplanung (Grid)            | `plan/exams/`                    | `slot/`, `exam/`              | `api/slot/`, `api/plan/`            |
|                       | EXaHM/SEB in T-Bau (Phase A)    | `plan/exams/roomsphase/`         | `room/`, `slot/`              | `api/room/`, `api/plan/`            |
|                       | Terminplan generieren (Phase B) | `plan/exams/generate/`           | `exam/`, `validation/`        | `api/exam/`, `api/semester/`        |
|                       | Validierung                     | `plan/exams/validate/`           | `validation/`                 | —                                   |
| **Raumplanung**       | Raumplanung                     | `plan/rooms/`                    | `room/`, `slot/`              | `api/room/`, `api/plan/`            |
|                       | Anny-Anforderungen (KDP)        | `plan/kdprooms/`                 | `room/`                       | `api/room/`                         |
|                       | Gebäudemanagement-Anforderungen | `plan/roomRequests/`             | `room/`                       | `api/room/`                         |
|                       | Validierung                     | `plan/rooms/validate/`           | `validation/`                 | —                                   |
| **Aufsichtenplanung** | Anforderungen und Planung       | `plan/invigilation/planning/`    | `invigilator/`                | `api/invigilator/`, `api/plan/`     |
|                       | Aufsichts-Constraints           | `plan/invigilation/constraints/` | `invigilator/`                | `api/invigilator/`                  |
|                       | Zeitplan (pro Tag)              | `plan/invigilation/` (`[day]`)   | `invigilator/`                | `api/plan/`                         |
|                       | Einteilung                      | `plan/invigilation/generate/`    | `invigilator/`, `validation/` | `api/invigilator/`, `api/semester/` |
|                       | Validierung                     | `plan/invigilation/validate/`    | `validation/`                 | —                                   |
| **E-Mails**           | E-Mails versenden               | `email/`                         | `email/`                      | `api/email/`                        |
|                       | E-Mail-Vorlagen                 | `email/templates/`               | `email/`                      | `api/email/`                        |
|                       | Anhänge (Deckblätter, Bilder)   | `email/attachments/`             | `email/`                      | `api/email/`                        |
|                       | Special Interests               | `email/specialInterests/`        | `email/`                      | `api/email/`                        |
| **Semesterdaten**     | ZPA-Import & Veröffentlichung   | `zpa/publish/`                   | `zpa/`                        | `api/zpaexams/`                     |
|                       | Zusätzliche Prüfungen           | `zpa/additionalExams/`           | `zpa/`, `exam/`               | `api/exam/`                         |
|                       | Dozierende & Aufsichten (ZPA)   | `zpa/teacher/`                   | `zpa/`, `invigilator/`        | `api/invigilator/`                  |
|                       | MUC.DAI-Prüfungen               | `primuss/mucdai/`                | `exam/`                       | `api/exam/`                         |
|                       | Primuss-Anmeldedaten            | `primuss/exams/`                 | `studentRegs/`                | `api/primuss/`                      |
|                       | Studierende                     | `students/`                      | `studentRegs/`                | `api/primuss/`                      |
|                       | Prüfungen anderer FKs           | `exam/external/` ¹               | `exam/`                       | `api/exam/`                         |
|                       | Anny-Buchungen                  | `rooms/annyBookings/` ¹          | `room/`                       | `api/room/`                         |
|                       | NTA (Semester)                  | `nta/semester/`                  | `nta/`                        | `api/nta/`                          |
|                       | Mutations-Log                   | `log/`                           | —                             | `api/log/`                          |
|                       | Semester-Konfiguration          | `config/`                        | `config/`                     | `api/semester/`                     |
|                       | Neues Semester anlegen          | `config/new/`                    | `config/`                     | `api/semester/`                     |
| **Stammdaten**        | Studiengänge                    | `studyprograms/`                 | —                             | `api/studyprogram/`                 |
|                       | Räume                           | `rooms/`                         | `room/`                       | `api/room/`                         |
|                       | NTAs (Stammdaten)               | `nta/all/` (`[mtknr]`)           | `nta/`                        | `api/nta/`                          |
|                       | Permanente Nicht-Aufsichten     | `invigilators/`                  | `invigilator/`                | `api/invigilator/`                  |
| _Pille_               | Validierung (global)            | `validate/`                      | `validation/`                 | —                                   |
| _Pille_               | ZPA-Status                      | `zpa/publish/`                   | `zpa/`                        | `api/zpaexams/`                     |

¹ **2026-07-05 verschoben** aus `plan/`; alte URLs leiten per `308` weiter
(`plan/external/+page.ts`, `plan/annyBookings/+page.ts`).

---

## api-Domänen (`src/routes/api/`)

Alle Mutationen/Proxys sind nach Domäne gruppiert (spiegelt `src/lib/`). Neue
Endpunkte in den passenden Ordner legen — flach unter `api/` **nichts** mehr.

| Ordner              | Endpunkte | Inhalt                                                                                                                     |
| ------------------- | --------: | -------------------------------------------------------------------------------------------------------------------------- |
| `api/exam/`         |        20 | Prüfungs-Constraints/Dauer, aufbereitete Prüfungen (Generieren/Reset), MUC.DAI-Verknüpfung, externe Termine                |
| `api/room/`         |        19 | Räume (CRUD), Raum-Anforderungen, Slot-Blockaden, Anny, Raumphasen-Fixierung                                               |
| `api/preplan/`      |        13 | SEB/EXaHM-Vorplanung (Anlegen, Ancode-Verknüpfung, Constraints, Generierung)                                               |
| `api/semester/`     |        10 | Semester/Workspace wechseln & anlegen, Read-only-Schutz, Config, Planer, Generierungs-Config                               |
| `api/primuss/`      |         9 | Primuss-Ancodes, StudentRegs, Studierende, Konflikt-Entscheidungen, Sammellisten-Reset                                     |
| `api/nta/`          |         6 | NTA anlegen/ändern/aktiv, Room-Alone-Waiver                                                                                |
| `api/invigilator/`  |         5 | Aufsichts-Constraints, permanente Nicht-Aufsichten, Reset                                                                  |
| `api/slot/`         |         5 | Erlaubte/heikle Slots, Prüfungen im Slot, Terminplan-Reset                                                                 |
| `api/email/`        |         7 | Anhänge (Liste/Löschen), Special Interests, E-Mail-Vorlagen (Vorschau/Speichern/Zurücksetzen)                              |
| `api/studyprogram/` |         3 | Studiengänge (Upsert/Delete), Seed aus Config                                                                              |
| `api/zpaexams/`     |         2 | ZPA-Prüfung in Plan / aus Plan                                                                                             |
| `api/log/`          |         1 | Mutations-Log                                                                                                              |
| `api/plan/`         |        11 | **Read-Lookups fürs Plan-Grid** (Slot/Raum/Aufsicht-Abfragen, interaktiv per `fetch`) — bewusst als eigene Gruppe belassen |

**Hinweis:** Einige POST-Proxys sind in Wahrheit Lese-Abfragen und dürfen auch im
geschützten (read-only) Semester laufen — die Allowlist steht in
[`src/hooks.server.js`](../src/hooks.server.js) (`READ_POST_PATHS`) und muss beim
Umbenennen eines solchen Endpunkts mitgeführt werden.
