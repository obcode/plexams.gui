# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A SvelteKit GUI for planning university exams (Prüfungsplanung) at HM (Hochschule München). It is a **thin frontend over a separate GraphQL backend** (the `plexams` server). This repo holds no business logic or persistence — it queries/mutates the backend and renders the result. The UI language is German; the domain vocabulary below is essential to navigating the code.

## Commands

```bash
npm run dev          # dev server (vite)
npm run devhost      # dev server exposed on the network (--host)
npm run build        # production build (adapter-node → ./build)
npm run preview      # serve the production build on :4173
npm run check        # svelte-check type checking (checkJs is on; .js files are type-checked)
npm run lint         # prettier --check + eslint
npm run format       # prettier --write
npm test             # playwright (builds + previews first, see playwright.config.js)
npx playwright test tests/test.js   # run a single test file
```

Codegen / schema:

```bash
npm run codegen                  # regenerate src/lib/__generated__/graphql.ts from schema.graphql
npm run update-schema.graphql    # refetch schema from $PLEXAMS_SERVER, then codegen
```

## Backend connection

The backend URL comes from `.env`:
- `PLEXAMS_SERVER` — private, used server-side (default `http://localhost:8080/query`).
- `PUBLIC_PLEXAMS_SERVER` — exposed to the client.

All data flows through this one GraphQL endpoint. `schema.graphql` is the committed copy of the backend schema; regenerate it with `update-schema.graphql` when the backend changes.

## Data-fetching architecture

There are **two GraphQL access patterns**, both using the `graphql-request` library directly (there is no normalized cache):

1. **SSR loads** — `src/routes/**/+page.server.js` export a `load()` that calls `request(env.PLEXAMS_SERVER, gql\`...\`)` and returns data to the page. Use this for initial page render.

2. **Client-side proxy endpoints** — `src/routes/api/**/+server.js` expose `GET`/`POST` handlers that forward a query or mutation to the backend (`import { env } from '$env/dynamic/private'`). Svelte components `fetch('/api/...')` these for interactivity (e.g. assigning an exam to a slot, planning a room). **Mutations go through these `/api` endpoints**, never directly from the browser. When adding interactivity, add an `/api/<name>/+server.js` that wraps the GraphQL call and `fetch` it from the component.

GraphQL queries are written inline as `gql\`...\`` template strings in each `+page.server.js` / `+server.js` — there are no shared `.graphql` document files. The same large exam selection set is duplicated across many files; when changing a query's fields, search for the other copies.

### Caveats about the data layer

- `src/client.ts` imports `$houdini` and looks like a Houdini GraphQL setup, but **Houdini is not configured or used** (no `houdini.config.js`, no `.houdini`). Treat it as dead scaffolding; the real client is `graphql-request`.
- `src/lib/__generated__/graphql.ts` (from graphql-codegen) is generated but currently imported only for a couple of TypeScript types (e.g. in `Nav.svelte`). It is not a runtime client.

## Routes / domain map

Route folders mirror the planning workflow. Key domain terms:
- **Exam / Prüfung** — has an `ancode` (the primary identifier across the system), a `mainExamer`, registrations, conflicts, constraints.
- **ZPA** — the central exam-administration system; source of exams to plan.
- **Primuss** — the registration system; source of student registrations (`studentRegs`).
- **NTA** — *Nachteilsausgleich*, disability accommodations (extra time, room-alone, etc.); a cross-cutting concern attached to exams and students (`mtknr` = student id).
- **Slot** — a (day, time) cell in the plan grid; exams are assigned to slots.
- **Room planning** — assigning rooms to slotted exams; **KDP / EXaHM / SEB** are special computer-exam room categories. **Anny** is an external room-booking source.
- **Invigilation / Aufsicht** — assigning supervisors to exam rooms per day/slot.
- **Constraints** — per-exam scheduling rules (fixed day/time, excluded days, same-slot, online, room requirements).

`src/lib/` is grouped by these domains (`exam/`, `slot/`, `nta/`, `invigilator/`, `examGroups/`, `examsInPlan/`, `zpa/`). `Nav.svelte` is the authoritative index of available pages and the workflow order.

## Conventions

- **Svelte 5 with legacy (non-runes) syntax** — components use `export let` props and `$store` auto-subscriptions, not `$props()`/`$state()`. Match the existing style; don't introduce runes unless migrating deliberately.
- Mixed `.js`/`.ts` for server files — both are type-checked (`checkJs: true`, `strict: true`). New server files can be either; follow the neighbours in the folder.
- Styling is **Tailwind v4 + daisyUI**; theme switching uses `theme-change` (see the theme list in `Nav.svelte`).
- Prettier: tabs, single quotes, no trailing commas, printWidth 100. Run `npm run format` before committing.
- Route param matchers live in `src/params/` (`string`, `integer`), used as `[mtknr=string]`.

## Tests

Playwright is configured but `tests/test.js` is the unmodified SvelteKit scaffold (it asserts "Welcome to SvelteKit" and does not reflect this app). There is effectively no real test coverage yet — don't rely on the suite passing as a signal.
