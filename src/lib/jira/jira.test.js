import { describe, it, expect } from 'vitest';
import { connectionStatus, normalizeIssueKey, isValidIssueKey } from './jira.js';

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
		expect(normalizeIssueKey('  plex-12 ')).toBe('PLEX-12');
	});
	it('verträgt null/undefined', () => {
		expect(normalizeIssueKey(/** @type {any} */ (undefined))).toBe('');
	});
});

describe('isValidIssueKey', () => {
	it('akzeptiert PROJ-123', () => {
		expect(isValidIssueKey('PLEX-12')).toBe(true);
		expect(isValidIssueKey('plex-12')).toBe(true);
		expect(isValidIssueKey('AB1-9')).toBe(true);
	});
	it('lehnt Unfug ab', () => {
		expect(isValidIssueKey('')).toBe(false);
		expect(isValidIssueKey('PLEX')).toBe(false);
		expect(isValidIssueKey('12-PLEX')).toBe(false);
		expect(isValidIssueKey('PLEX-')).toBe(false);
	});
});
