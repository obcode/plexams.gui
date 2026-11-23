import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// Eigene GUI-Version für den Footer, zur Buildzeit eingebacken.
// Quelle in dieser Reihenfolge:
//   1. APP_VERSION (im Docker-Release via build-arg aus dem semantic-release-Tag)
//   2. `git describe` (lokale Builds; im Docker-Image nicht verfügbar, .git ist
//      per .dockerignore ausgeschlossen)
//   3. package.json (letzter Fallback; im Repo bewusst ein Platzhalter, da
//      semantic-release den Bump nicht zurückcommittet)
const pkg = JSON.parse(
	readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')
);

function gitDescribe() {
	try {
		return execSync('git describe --tags --always --dirty', {
			stdio: ['ignore', 'pipe', 'ignore']
		})
			.toString()
			.trim();
	} catch {
		return null;
	}
}

const appVersion = process.env.APP_VERSION?.trim() || gitDescribe() || pkg.version;

// Zeitpunkt des Builds für den Footer, ISO-8601. Im Docker-Release ist der
// Build-Zeitpunkt praktisch der Release-Zeitpunkt (das Image wird direkt nach
// dem semantic-release-Tag gebaut). Über BUILD_TIME überschreibbar, falls ein
// reproduzierbarer/exakter Zeitstempel gewünscht ist.
const buildTime = process.env.BUILD_TIME?.trim() || new Date().toISOString();

// The SvelteKit configuration. Since SvelteKit 3 it is passed to the plugin here; a
// svelte.config.js is refused. vitest.config.ts extends this file, so tests compile with the
// same options.
const kit = sveltekit({
	// Endschalter: das gesamte eigene Projekt läuft im Runes-Modus (Legacy-Syntax
	// wie `export let` / `$:` / `on:` wäre ab hier ein Compile-Fehler).
	compilerOptions: {
		runes: true
	},
	preprocess: vitePreprocess(),
	adapter: adapter(),
	// Third-party libraries that ship their .svelte sources (e.g. @svelte-plugins/tooltips)
	// still use legacy syntax, which the global runes:true would break. For node_modules the
	// mode is therefore left to the compiler, which detects it per component. Not
	// `runes: false`: SvelteKit 3's own root component uses runes syntax and does not compile
	// in legacy mode. This escape hatch is for dependencies, never for src/.
	dynamicCompileOptions({ filename }) {
		if (filename.includes('node_modules')) return { runes: undefined };
	}
});

export default defineConfig({
	// Tailwind v4 als Vite-Plugin, nicht über postcss.config: seit Vite 8 läuft
	// Vites eingebautes postcss-import über `@import 'tailwindcss'`, bevor das
	// PostCSS-Plugin es ersetzen kann, und sucht dann eine Datei dieses Namens.
	plugins: [tailwindcss(), kit],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion),
		__BUILD_TIME__: JSON.stringify(buildTime),
		// Sentry's tree-shaking flag: no tracing code in the bundle. Tracing is off anyway (no
		// tracesSampleRate), but the SDK still adds its browser-tracing integration by default.
		// That integration picks its SvelteKit 3 variant (`$app/state`) only through Sentry's own
		// Vite plugin, which is deliberately not used here; the fallback subscribes to
		// `$app/stores`, which SvelteKit 3 removed, and throws `app_stores_removed` on every
		// page load.
		__SENTRY_TRACING__: false
	},
	// Unit-Tests (vitest) leben in src/; e2e-Smoke-Tests (Playwright) in tests/.
	// Explizit scopen, damit `pnpm test` die Playwright-Specs nie einsammelt.
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
