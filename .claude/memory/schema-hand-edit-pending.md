---
name: schema-hand-edit-pending
description: schema.graphql was hand-edited on 2026-11-26 and 2026-11-27 (StudyProgram.shortname/zpaCode descriptions only); re-sync with update-schema.graphql when the backend runs.
metadata:
  type: project
---

`schema.graphql` was edited by hand twice without a running backend, only doc strings,
no types:
- 2026-11-26: `StudyProgram.zpaCode` description (plexams.go e812ab1).
- 2026-11-27: `StudyProgram.shortname` and `zpaCode` descriptions (plexams.go 5cbda37:
  two-letter Kürzel, DC-M only where needed; ZPA code = group prefix).

**Why:** CLAUDE.md asks for a note whenever the schema copy is edited by hand.
**How to apply:** the next time the backend is up, run `pnpm run update-schema.graphql`;
if it shows no diff for these fields, delete this note.
