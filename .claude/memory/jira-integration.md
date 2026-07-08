---
name: jira-integration
description: "/jira page — Service-Desk (FK07PP) frontend over the backend Jira API; layout, endpoints, and backend field quirks"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5f20f88d-0e03-4eb6-8474-57fc728ad006
---

Die `/jira`-Seite ([src/routes/jira/](../../../workspace/plexams.gui/src/routes/jira/), Nav: *Semesterdaten → Weitere*) ist das GUI zur on-prem-Jira `jira.cc.hm.edu`, Service-Desk-Projekt **FK07PP**. Backend: plexams.go, Branch `feat/jira-integration`, per PAT (Config serverseitig: jira.baseurl/token/project — GUI konfiguriert nichts).

**Aufbau:** Liste (3 Sichten: flach / nach Typ / nach Anfragetyp) links, Detail-Panel rechts (Beschreibung, Autor, Kommentar-Thread, Aktionen Kommentar/Status/Anhang). Verbindungs-Badge aus `jiraConnection`.

**Nicht-offensichtliche Backend-Eigenheiten (per Introspektion/live geprüft 2026-07-08):**
- `created` ist in den **Listen**-Queries `null` (bewusst schnell gehalten) — echtes Datum nur in `jiraIssue(key)`. Darum blendet sich die „Erstellt"-Spalte nur ein, wenn Daten da sind (`anyCreated`).
- `comments` sind **nur** in `jiraIssue(key)` befüllt, in den Listen leer → für den Thread immer die Detail-Query.
- „nach Typ" wird **clientseitig** aus `jiraOpenIssues` gruppiert (`groupByIssueType`), nicht via `jiraOpenIssuesByType` — die flache Liste trägt schon `issueType`+`reporter`, spart einen Query und hält die Spalten identisch.
- `jiraOpenIssuesByRequestType` (Customer Request Type) ist für FK07PP die relevante Default-Gruppierung; live aktuell alles „EXaHM / SEB".

**Datenfluss:** GraphQL über `api/jira/*`-Proxies (gqlProxy); **Attachment nicht** über GraphQL, sondern `POST /upload/jira-attachment` (multipart, Felder `key`+`file`) via `postUpload` aus [attachments.js]. Reine Helfer + Tests in [src/lib/jira/jira.js]. Siehe [[source-structure]], [[always-commit-push]].

**Offen/Follow-up:** Write-Pfade (create/comment/transition/attach) sind schema-verifiziert, aber nicht live gegen echtes Jira ausgeführt (erzeugt externe Artefakte). „Generierten Download (PDF/CSV) direkt an ein Issue hängen" ist im Backend vorgesehen (Datei aus `/download/*` holen → weiterposten), im GUI noch nicht gebaut.
