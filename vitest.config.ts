import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

// Unit-Tests der puren Logik (lib/**/*.test.ts). Playwright (tests/) bleibt für
// e2e und wird über testnamePattern/include hier ausgeschlossen.
//
// Extends vite.config.js rather than calling sveltekit() again: since SvelteKit 3 the SvelteKit
// options are arguments of that plugin call, and a second, bare call would compile the tests
// without them (no runes mode, no adapter).
export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}'],
			environment: 'node',
			coverage: {
				provider: 'v8',
				include: ['src/lib/**/*.{js,ts}'],
				exclude: ['src/lib/**/*.{test,spec}.{js,ts}', 'src/lib/__generated__/**']
			}
		}
	})
);
