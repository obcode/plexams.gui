import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	// Unit-Tests (vitest) leben in src/; e2e-Smoke-Tests (Playwright) in tests/.
	// Explizit scopen, damit `pnpm test` die Playwright-Specs nie einsammelt.
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
