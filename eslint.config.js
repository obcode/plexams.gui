import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Flat-Config (ESLint 9/10). Prettier übernimmt die Formatierung; ESLint nur
// Code-Qualität. Reihenfolge: erst die Regelwerke, danach `prettier` /
// `flat/prettier`, um formatierungsnahe Regeln wieder abzuschalten.
export default ts.config(
	{
		// Generierter Code, Build-Artefakte und totes Scaffolding nicht linten.
		ignores: ['build/', '.svelte-kit/', 'package/', 'src/lib/__generated__/', 'src/client.ts']
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		// Svelte-Dateien mit dem TS-Parser für <script lang="ts"> ausstatten.
		files: ['**/*.svelte', '**/*.svelte.js', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		// Regeln, die aktuell viel Rauschen erzeugen. Sie sind hier abgeschaltet,
		// damit `eslint .` als sinnvolle Baseline durchläuft — NICHT weil der Stil
		// final so gewollt ist. Mehrere davon sollten bei der geplanten
		// Modernisierung (Runes + strengere Typisierung) wieder aktiviert und die
		// Fundstellen abgearbeitet werden. Siehe TODO-Kommentare.
		rules: {
			// TODO(runes): SvelteMap/SvelteSet statt Map/Set für Reaktivität —
			// beim Runes-Umbau aktivieren und die ~60 Stellen migrieren.
			'svelte/prefer-svelte-reactivity': 'off',
			// TODO(typing): Backend-Daten sind derzeit untypisiert (`any`). Bei der
			// TS-Modernisierung schrittweise Typen einführen und wieder anschalten.
			'@typescript-eslint/no-explicit-any': 'off',
			// Kandidaten zum späteren Aktivieren (eher Aufräum- als Stilfragen):
			// Keys für dynamische {#each}-Listen, resolve() bei Navigation.
			'svelte/require-each-key': 'off',
			'svelte/no-navigation-without-resolve': 'off',
			// Bleibt aus: {@html} rendert ausschließlich vertrauenswürdige
			// ansi-to-html-Log-Ausgaben (kein User-Input).
			'svelte/no-at-html-tags': 'off',
			// Ungenutzte Bindings als Warnung sichtbar halten; `_`-Präfix erlaubt.
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		// SvelteKit-Scaffold-Test (kein echter App-Test): @ts-nocheck tolerieren.
		files: ['tests/**'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off'
		}
	}
);
