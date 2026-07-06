import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Eigene GUI-Version aus package.json in den Build backen (Footer).
const pkg = JSON.parse(
	readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')
);

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	// Unit-Tests (vitest) leben in src/; e2e-Smoke-Tests (Playwright) in tests/.
	// Explizit scopen, damit `pnpm test` die Playwright-Specs nie einsammelt.
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
