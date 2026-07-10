import { describe, it, expect } from 'vitest';
import { roleOf, isViewer, isAdmin, displayName } from './auth';

describe('auth role helpers', () => {
	it('roleOf normalisiert auf Großschreibung und liefert leer bei fehlender Rolle', () => {
		expect(roleOf({ role: 'viewer' })).toBe('VIEWER');
		expect(roleOf({ role: 'Admin' })).toBe('ADMIN');
		expect(roleOf({})).toBe('');
		expect(roleOf(null)).toBe('');
		expect(roleOf(undefined)).toBe('');
	});

	it('isViewer erkennt nur die VIEWER-Rolle (case-insensitive)', () => {
		expect(isViewer({ role: 'VIEWER' })).toBe(true);
		expect(isViewer({ role: 'viewer' })).toBe(true);
		expect(isViewer({ role: 'ADMIN' })).toBe(false);
		expect(isViewer({ role: 'PLANER' })).toBe(false);
		// null/Dev-User = voller Zugriff, kein Ausblenden
		expect(isViewer(null)).toBe(false);
	});

	it('isAdmin erkennt nur die ADMIN-Rolle', () => {
		expect(isAdmin({ role: 'ADMIN' })).toBe(true);
		expect(isAdmin({ role: 'admin' })).toBe(true);
		expect(isAdmin({ role: 'VIEWER' })).toBe(false);
		expect(isAdmin(null)).toBe(false);
	});

	it('displayName bevorzugt den Namen, fällt auf die E-Mail zurück', () => {
		expect(displayName({ name: 'Ada', email: 'ada@hm.edu' })).toBe('Ada');
		expect(displayName({ email: 'ada@hm.edu' })).toBe('ada@hm.edu');
		expect(displayName({ name: '', email: 'ada@hm.edu' })).toBe('ada@hm.edu');
		expect(displayName(null)).toBe('');
	});
});
