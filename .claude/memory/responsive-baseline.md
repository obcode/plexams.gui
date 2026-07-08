---
name: responsive-baseline
description: App ist Tablet-first responsiv gemacht; Konventionen + wie man Mobil-Overflow verifiziert
metadata: 
  node_type: memory
  type: project
  originSessionId: d54e8c79-f8c8-4e12-953d-37a1c0906b9d
---

Die GUI wurde 2026-07-08 durchgängig Tablet-first responsiv gemacht (Phone = saubere
Ansicht, dichte Plan-Raster scrollen bewusst horizontal). Erledigt in 4 Commits auf main:

1. **Grundgerüst**: `app.html` Viewport `initial-scale=1`; `+layout.svelte` zieht `<Nav>`
   aus dem festen `p-8` (Sticky-Header klebt jetzt am Rand), Content-Wrapper hat
   responsives Padding `px-3 sm:px-4 lg:px-8` (kein globaler max-width — Raster brauchen Breite).
2. **Nav mobil**: Semester-/Workspace-Steuerung zusätzlich im Hamburger (`sm:hidden`), war
   <640px unerreichbar. Topbar verursachte auf JEDER Seite +30px Overflow, weil die
   Validierungs-Pille alle Einzel-Dots rendert (~142px) → auf Mobil nur ein Sammel-Dot
   (`validationSummary`), Einzelpunkte erst ab `sm`.
3. **Quick-Wins**: kdprooms-Tabellen in `overflow-x-auto`, SlotExam `w-96`→`w-full sm:w-96`,
   nicht-responsive `grid-cols-N` mit Mobile-Fallback.
4. Doku in [CLAUDE.md](../../../workspace/plexams.gui/CLAUDE.md) („Conventions").

**Konvention** (siehe [[ui-design-language]]): Padding kommt aus dem Layout-Wrapper (keine
eigenen `p-8`); mehrspaltige Grids immer `grid-cols-1 sm:grid-cols-N`; breite Tabellen/Raster
in `overflow-x-auto`; Toolbars `flex-wrap`; fixe Feldbreiten `w-full sm:w-<n>`.

**Verifikation von Mobil-Overflow**: throwaway Playwright-Script, das jede parameterfreie
Route (Liste in `tests/smoke.test.js`) bei viewport 375px lädt und
`documentElement.scrollWidth - clientWidth` prüft; Übeltäter herausfiltern, die in einem
Vorfahren mit `overflow-x: auto/scroll/hidden` liegen (legitimer interner Scroll). Braucht
laufenden Dev/Preview + Backend. **Wichtig**: `pnpm preview`/`dev` NUR über den Tool-
Hintergrundmodus (`run_in_background`) starten — `&`/`nohup` werden beim Bash-Call-Ende
gekillt. Voller `pnpm build` wird bei wenig freiem RAM OOM-gekillt (137); dann `dev` nutzen.
**Immer bei 375 UND 768 UND 1024 prüfen** — ein reiner 375px-Sweep übersieht
Tablet-/Zwischenbreiten: die Topbar (festes h-16, kein Umbruch) lief bei 640–1439px
über, weil ab lg das ~691px-Desktop-Mega-Menü zusätzlich zu Pillen+Semester erscheint.
Behoben durch Neustaffelung der Nav-Breakpoints (Desktop-Menü erst ab xl, Pillen bis 2xl
kompakt, Wortmarke/Theme-Name nur wo Platz). Karten-Raster (Dashboard-Phasen) nutzen ein
container-basiertes Auto-Fit-Grid `grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))]`
statt fester `md:/xl:`-Breakpoints — reflowt kontinuierlich beim Resizen (auch Safari),
robust gegen wechselnde Kartenzahl, kein 4+1-Waisenkind. Stand: 0 Overflow über 320–1920px
und alle 39 Routen bei 375/768/1024.
