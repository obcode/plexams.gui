# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A SvelteKit GUI for planning university exams (Prüfungsplanung) at HM (Hochschule München). It is a **thin frontend over a separate GraphQL backend** (the `plexams` server). This repo holds no business logic or persistence — it queries/mutates the backend and renders the result. The UI language is German; the domain vocabulary below is essential to navigating the code.

## Commands

The package manager is **pnpm** (pinned via the `packageManager` field; use Corepack).

```bash
pnpm install         # install deps (CI uses --frozen-lockfile)
pnpm dev             # dev server (vite)
pnpm devhost         # dev server exposed on the network (--host)
pnpm build           # production build (adapter-node → ./build)
pnpm preview         # serve the production build on :4173
pnpm check           # svelte-check type checking (checkJs is on; .js files are type-checked)
pnpm lint            # prettier --check . && eslint . (config: eslint.config.js)
pnpm format          # prettier --write (formats .svelte too, via prettier-plugin-svelte)
pnpm test            # vitest unit tests (run once)
pnpm test:e2e        # playwright (builds + previews first, see playwright.config.js)
pnpm exec vitest run src/lib/foo.test.js   # run a single unit-test file
```

Codegen / schema:

```bash
pnpm codegen                  # regenerate src/lib/__generated__/graphql.ts from schema.graphql
pnpm run update-schema.graphql    # refetch schema from $PLEXAMS_SERVER, then codegen
```

## Backend connection

The backend URL comes from `.env`:

- `PLEXAMS_SERVER` — private, used server-side (default `http://localhost:8080/query`).
- `PUBLIC_PLEXAMS_SERVER` — exposed to the client.

All data flows through this one GraphQL endpoint. `schema.graphql` is the committed copy of the backend schema; regenerate it with `update-schema.graphql` when the backend changes.

### Error reporting

With `SENTRY_DSN` / `PUBLIC_SENTRY_DSN` set, server and browser errors are reported to a Sentry-compatible backend (GlitchTip); unset (the default, and all of local development) it is a complete no-op. Browser events go through the same-origin tunnel at `/monitoring`, never straight to the monitoring host.

Everything that sends passes the fail-closed scrubber in [src/lib/obs/scrub.js](src/lib/obs/scrub.js) — **read it before touching anything that reports.** Tags, headers and contexts are allow-lists; the request body, query string and cookies are never included (128 of the 134 `/api` proxies forward a browser body that carries `mtknr`, names and mail addresses). Deliberately absent: `sentrySvelteKit()` in `vite.config.js` (so stack traces stay minified) and Session Replay. See [.claude/memory/error-reporting-obs.md](.claude/memory/error-reporting-obs.md) for the four traps, in particular that `ORIGIN` must be set for adapter-node or SvelteKit's CSRF check drops browser reports silently.

## Data-fetching architecture

There are **two GraphQL access patterns**, both using the `graphql-request` library directly (there is no normalized cache):

1. **SSR loads** — `src/routes/**/+page.server.js` export a `load()` that calls `request(env.PLEXAMS_SERVER, gql\`...\`)` and returns data to the page. Use this for initial page render.

2. **Client-side proxy endpoints** — `src/routes/api/**/+server.js` expose `GET`/`POST` handlers that forward a query or mutation to the backend (`import { env } from '$env/dynamic/private'`). Svelte components `fetch('/api/...')` these for interactivity (e.g. assigning an exam to a slot, planning a room). **Mutations go through these `/api` endpoints**, never directly from the browser. Endpoints are **grouped into domain subfolders** that mirror `src/lib/` (`api/exam/`, `api/room/`, `api/nta/`, `api/slot/`, `api/semester/`, …) — see [docs/ROUTES.md](docs/ROUTES.md) for the full catalog. When adding interactivity, add `api/<domain>/<name>/+server.js` (never flat under `api/`) and `fetch('/api/<domain>/<name>')` from the component.

GraphQL queries are written inline as `gql\`...\``template strings in each`+page.server.js`/`+server.js`— there are no shared`.graphql` document files. The same large exam selection set is duplicated across many files; when changing a query's fields, search for the other copies.

### Caveats about the data layer

- `src/lib/__generated__/graphql.ts` (from graphql-codegen) is generated but currently imported only for a couple of TypeScript types (e.g. in `Nav.svelte`). It is not a runtime client.

## Routes / domain map

Route folders mirror the planning workflow. Key domain terms:

- **Exam / Prüfung** — has an `ancode` (the primary identifier across the system), a `mainExamer`, registrations, conflicts, constraints.
- **ZPA** — the central exam-administration system; source of exams to plan.
- **Primuss** — the registration system; source of student registrations (`studentRegs`).
- **NTA** — _Nachteilsausgleich_, disability accommodations (extra time, room-alone, etc.); a cross-cutting concern attached to exams and students (`mtknr` = student id).
- **Slot** — a (day, time) cell in the plan grid; exams are assigned to slots.
- **Room planning** — assigning rooms to slotted exams; **KDP / EXaHM / SEB** are special computer-exam room categories. **Anny** is an external room-booking source.
- **Invigilation / Aufsicht** — assigning supervisors to exam rooms per day/slot.
- **Constraints** — per-exam scheduling rules (fixed day/time, excluded days, same-slot, online, room requirements).

`src/lib/` is grouped by these domains (`exam/`, `slot/`, `nta/`, `invigilator/`, `examsInPlan/`, `zpa/`). `Nav.svelte` is the authoritative index of available pages and the workflow order.

**The NavBar groups by workflow phase; route/lib/api folders group by domain** — these two axes differ on purpose. [docs/ROUTES.md](docs/ROUTES.md) is the index that maps each NavBar entry → page route → `lib` domain → `api` domain, plus the `api/` domain-folder catalog. Consult it to jump from a menu item to its source.

## Conventions

- **Svelte 5 in runes mode** — `svelte.config.js` sets `compilerOptions.runes: true` for the whole project, so legacy syntax (`export let`, `$:`, `on:click`, `createEventDispatcher`, `<slot>`) is a **compile error**, not a style preference. Use `$props()` for props, `$state()` for local state, `$derived`/`$derived.by()` for computed values, `$effect()` for side effects, callback props for events, and `{@render children()}` for slots. `$store` auto-subscription still works and is used throughout. Third-party packages that ship legacy `.svelte` sources are compiled in legacy mode on purpose via `dynamicCompileOptions` (`node_modules` only) — that escape hatch is for dependencies, never for `src/`.
- Mixed `.js`/`.ts` for server files — both are type-checked (`checkJs: true`, `strict: true`). New server files can be either; follow the neighbours in the folder.
- Styling is **Tailwind v4 + daisyUI**; theme switching uses `theme-change` (see the theme list in `Nav.svelte`).
- Prettier: tabs, single quotes, no trailing commas, printWidth 100. Run `pnpm format` before committing.
- Route param matchers live in `src/params/` (`string`, `integer`), used as `[mtknr=string]`.
- **Responsive (Tablet-first, Phone-Ansicht)** — the app targets full usability on tablet (≥ 768px) and clean viewing on phone (~375px). The horizontal page padding comes from the layout wrapper in `+layout.svelte` (`px-3 sm:px-4 lg:px-8`); **new pages don't add their own `p-8`**. Rules of thumb: multi-column grids always carry a mobile fallback (`grid-cols-1 sm:grid-cols-N`, never a bare `grid-cols-N ≥ 2`); wide tables and dense plan grids live in an `overflow-x-auto` container (they scroll rather than reflow); toolbars/filter rows use `flex-wrap`; fixed-width form controls go `w-full sm:w-<n>`. The dense planning grids (`plan/exams`, `plan/rooms`) deliberately scroll horizontally on small screens — don't rebuild them into card lists. When touching layout, sanity-check at 375px (DevTools device toolbar or a throwaway Playwright script checking `documentElement.scrollWidth > clientWidth`).

## Tests

Two layers:

- **Unit tests (vitest)** — pure logic extracted into `src/lib/**/*.test.{js,ts}` (40 tests). Run with `pnpm test`. `vite.config.js` scopes vitest's `include` to `src/**` so it never picks up the Playwright specs.
- **E2E smoke tests (Playwright)** — `tests/smoke.test.js` visits every parameter-free route and asserts it renders (HTTP < 400 + the layout `<nav>` attaches), catching broken `load()`s and render crashes broadly. Run with `pnpm test:e2e`. **Needs the backend running** (`PLEXAMS_SERVER`, test semester `Test26SS`) — so it is **not** part of the CI gate (`quality.yml`), which has no backend. The DevContainer ships Chromium under `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`; `@playwright/test` is pinned to match that browser build. `/dev/shm` is only 64 MB in the container, so the config passes `--disable-dev-shm-usage`, caps workers, and allows 1 retry to avoid renderer crashes.

Parameterized routes (`[ancode]`, `[code]`, `[mtknr]`, `[day]`) are not yet smoke-tested (they need real IDs).
