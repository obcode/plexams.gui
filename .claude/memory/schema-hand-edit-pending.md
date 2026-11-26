---
name: schema-hand-edit-pending
description: schema.graphql was hand-edited on 2026-11-26 (StudyProgram.zpaCode description only); re-sync with update-schema.graphql when the backend runs.
metadata:
  type: project
---

On 2026-11-26 the `StudyProgram.zpaCode` description in `schema.graphql` was edited by
hand to match plexams.go commit e812ab1 (fk07: empty zpaCode is derived from the
Kürzel by stripping `-B`/`-M`). No backend was running. Only a doc string changed, no
types.

**Why:** CLAUDE.md asks for a note whenever the schema copy is edited by hand.
**How to apply:** the next time the backend is up, run `pnpm run update-schema.graphql`;
if it shows no diff for this field, delete this note.
