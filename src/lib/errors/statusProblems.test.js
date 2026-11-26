import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { statusFailed, statusOk, statusProblems } from '#lib/errors/statusProblems.js';
import { UNREACHABLE_MESSAGE } from '#lib/errors/plannerErrors.js';

describe('statusProblems', () => {
	it('keeps a failure until the same query succeeds', () => {
		statusFailed('backup', 'Sicherung', 'keine Verbindung');
		statusFailed('regs', 'Anmeldungen', 'keine Verbindung');
		expect(Object.keys(get(statusProblems)).sort()).toEqual(['backup', 'regs']);
		statusOk('backup');
		expect(Object.keys(get(statusProblems))).toEqual(['regs']);
		statusOk('regs');
		expect(get(statusProblems)).toEqual({});
	});

	it('does not speak of an unsaved input for a query', () => {
		statusFailed('x', 'X', UNREACHABLE_MESSAGE);
		expect(get(statusProblems).x.message).not.toContain('gespeichert');
		statusOk('x');
	});
});
