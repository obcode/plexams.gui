---
name: user-facing-texts
description: How descriptions and error messages are written for a planner who is new to exam planning; the help building blocks and the error-code mapping
metadata:
  type: project
---

Since 2026-11-26 the GUI is being reworded so that a planner who is new to exam
planning and has never seen the code can work alone. Staged; this note is the
standing rule for every page touched from now on.

**Writing rules**

- Page introduction (2-4 sentences below the heading): what the page is for, when in
  the workflow it is due and what must be done before, what comes next.
- A button with consequences (import, generate, send, delete, upload) says next to it
  what it writes or overwrites, whether it can be undone, and that there is a dry run.
  Confirm dialogs name the consequence.
- A message says what happened, whom or what it concerns, and what to do. Exams as
  "Modul (Prüfer:in, Ancode 123)", people by name. No field names, keys, SQL or HTTP text.
- One spelling per term: "Ancode", "Probelauf", "… & speichern", "Vorgabe" for
  constraint in running text. Planner pages address the reader with "du", the portal
  with "Sie".

**Building blocks**

- `src/lib/help/PageIntro.svelte` — heading, count badge, introduction, collapsible
  "So gehst du vor", link into the help page.
- `src/lib/help/Term.svelte` + `glossary.js` — a glossary term with tooltip and link.
- `src/lib/help/workflow.js` — what/why/note per checklist step, keyed like
  `conditionLinks.js`; `workflow.test.js` lists the backend's step keys and fails
  when a step has no explanation.
- `/hilfe` — workflow, validation levels, "when something does not work", glossary.

**Errors**

- `src/lib/errors/plannerErrors.js` maps the backend's error codes to German advice;
  `gqlErrorMessage` and `gqlProxy` (`{ error, code }`) use it, so every `/api` proxy
  and SSR load is covered. `httpErrorMessage(status)` replaces "Fehler (HTTP n)".
- `src/lib/errors/streamErrors.js` does the same for ERROR lines of a stream
  (`{ level, text, code }`) and for a broken websocket.
- Never match backend message text. React to `code` (`BUSY`, `PUBLISHED_LOCKED`,
  `ALREADY_SENT`, `ALREADY_EXISTS`, finding code `NTA_ROOM_NOT_ALONE`). A new backend
  code needs a message here; `plannerErrors.test.js` lists the codes.

**Why:** the planner of 2026-WS works alone and had to ask about most pages and
messages; seven places matched English backend text with regular expressions, so no
message could be reworded safely.
