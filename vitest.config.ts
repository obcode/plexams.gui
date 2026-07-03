import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

// Unit-Tests der puren Logik (lib/**/*.test.ts). Playwright (tests/) bleibt für
// e2e und wird über testnamePattern/include hier ausgeschlossen.
export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: ['src/lib/**/*.{js,ts}'],
			exclude: ['src/lib/**/*.{test,spec}.{js,ts}', 'src/lib/__generated__/**']
		}
	}
});
