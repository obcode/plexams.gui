import { describe, it, expect } from 'vitest';
import { connectionStatus, normalizeIssueKey, resolveIssueKey, isValidIssueKey } from './jira.js';

describe('connectionStatus', () => {
	it('meldet Erfolg mit displayName', () => {
		const s = connectionStatus({ name: 'hm-obraun', displayName: 'Oliver Braun' });
		expect(s.ok).toBe(true);
		expect(s.text).toContain('Oliver Braun');
	});

	it('fällt auf name zurück, wenn kein displayName da ist', () => {
		expect(connectionStatus({ name: 'hm-obraun' }).text).toContain('hm-obraun');
	});

	it('ist nicht ok bei null', () => {
		expect(connectionStatus(null).ok).toBe(false);
	});

	it('ist nicht ok bei Fehler (PAT)', () => {
		const s = connectionStatus(null, 'HTTP 401');
		expect(s.ok).toBe(false);
		expect(s.text).toMatch(/PAT/);
	});
});

describe('normalizeIssueKey', () => {
	it('trimmt und macht Großbuchstaben', () => {
		expect(normalizeIssueKey('  fk07pp-12 ')).toBe('FK07PP-12');
	});
	it('verträgt null/undefined', () => {
		expect(normalizeIssueKey(/** @type {any} */ (undefined))).toBe('');
	});
});

describe('resolveIssueKey', () => {
	it('macht aus einer reinen Nummer FK07PP-<n>', () => {
		expect(resolveIssueKey('12')).toBe('FK07PP-12');
		expect(resolveIssueKey('  7 ')).toBe('FK07PP-7');
	});
	it('lässt einen vollständigen Key unverändert (nur normalisiert)', () => {
		expect(resolveIssueKey('fk07pp-12')).toBe('FK07PP-12');
		expect(resolveIssueKey('ABC-9')).toBe('ABC-9');
	});
	it('respektiert ein abweichendes Projekt', () => {
		expect(resolveIssueKey('3', 'ABC')).toBe('ABC-3');
	});
	it('verträgt leere Eingabe', () => {
		expect(resolveIssueKey('')).toBe('');
	});
});

describe('isValidIssueKey', () => {
	it('akzeptiert PROJ-123', () => {
		expect(isValidIssueKey('FK07PP-12')).toBe(true);
		expect(isValidIssueKey('fk07pp-12')).toBe(true);
		expect(isValidIssueKey('AB1-9')).toBe(true);
	});
	it('lehnt Unfug ab', () => {
		expect(isValidIssueKey('')).toBe(false);
		expect(isValidIssueKey('FK07PP')).toBe(false);
		expect(isValidIssueKey('12-FK07PP')).toBe(false);
		expect(isValidIssueKey('FK07PP-')).toBe(false);
	});
});
