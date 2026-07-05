---
name: email-templates-editor
description: Where the e-mail-template editor lives (/email/templates) and its GraphQL contract
metadata: 
  node_type: memory
  type: project
  originSessionId: e60cfa27-bb66-4764-8b2e-3403e44ee5b6
---

GUI-Editor für die Markdown-Go-Templates, aus denen das Backend jede E-Mail rendert (Override-Layer über eingebauten Defaults). Nav "E-Mails" → "📝 E-Mail-Vorlagen" → `/email/templates`. Für Nicht-Go-Nutzer gedacht.

**Seite** `src/routes/email/templates/`: `+page.server.ts` lädt SSR `emailTemplates{name,description,markdown,isDefault,defaultMarkdown,variables{name,description,example}}` + `emailTemplateFunctions{name,usage,description}` in EINER Query. `+page.svelte` = Master/Detail in einem Screen (kein Route-Param — `name` ist ein Dateiname wie `exahmEmail.md.tmpl` mit Punkten): Liste als Karten-Grid mit Suche/„angepasst"-Badges; Klick setzt `selectedName` und zeigt den Editor. Lokale `$state`-Kopie der Liste, damit Speichern/Reset sie sofort ohne Reload aktualisiert.

**Editor** `src/lib/email/EmailTemplateEditor.svelte` (Svelte-5-Runes, wie der Rest der email-Area): links Textarea (kein CodeMirror — dependency-frei) + Variablen-Panel (Klick fügt `{{ … }}` an Cursorposition ein, via `bind:this`+`tick`) + einklappbare Funktionsliste; rechts Live-Vorschau in **sandboxed iframe** (`sandbox=""`, kein Script) mit HTML|Klartext-Umschalter, debounced 400 ms, Seq-Zähler gegen out-of-order. `renderEmailTemplatePreview.error` bzw. Proxy-Fehler → rote Fehlerbox STATT der letzten guten Vorschau. Diff-Ansicht (Tab „Änderungen") zeigt zwei Zeilen-Diffs: gegen gespeichert + gegen Standard, über `src/lib/email/templateDiff.js` (`lineDiff` LCS + `diffStat`, 7 vitest-Tests). `beforeNavigate`+`beforeunload` warnen bei ungespeicherten Änderungen. Speichern/Reset = `WriteButton` (read-only-gated).

**API-Proxys** (`src/routes/api/email/`, alle via `gqlProxy`): `renderEmailTemplatePreview` (POST, aber reine Lese-Query → in `hooks.server.js` `READ_POST_PATHS` freigeschaltet, läuft auch im geschützten Semester), `setEmailTemplate` (Mutation, wirft bei nicht-parsendem Markdown → HTTP 400 angezeigt), `resetEmailTemplate` (Mutation, Boolean).

Wie die E-Mail-Subscriptions sind diese Typen NICHT in der committeten `schema.graphql` (inline-`gql`-Strings, daher keine Editor-Diagnostics dafür). Reset gilt aktuell als Mutation → im read-only-Semester blockiert; falls Vorlagen semester-übergreifend editierbar sein sollen, `setEmailTemplate`/`resetEmailTemplate` in `READ_POST_PATHS` aufnehmen. Siehe [[email-sending-architecture]], [[ui-design-language]], [[source-structure]].
