import { describe, expect, it } from 'vitest';
import { parseDsn } from './dsn';

describe('parseDsn', () => {
	it('zerlegt eine gewöhnliche DSN', () => {
		expect(parseDsn('https://abc123@glitchtip.example/2')).toEqual({
			origin: 'https://glitchtip.example',
			projectId: '2',
			publicKey: 'abc123',
			// sentry_key muss mit: ohne ihn antwortet GlitchTip auf einen
			// getunnelten Envelope mit 403.
			ingestUrl: 'https://glitchtip.example/api/2/envelope/?sentry_key=abc123'
		});
	});

	it('behält den Port', () => {
		expect(parseDsn('http://abc123@localhost:8000/1')?.ingestUrl).toBe(
			'http://localhost:8000/api/1/envelope/?sentry_key=abc123'
		);
	});

	it('kommt mit einer Installation in einem Unterpfad klar', () => {
		expect(parseDsn('https://abc123@example.org/glitchtip/7')?.ingestUrl).toBe(
			'https://example.org/glitchtip/api/7/envelope/?sentry_key=abc123'
		);
	});

	it('lässt den öffentlichen Schlüssel aus dem origin heraus', () => {
		expect(parseDsn('https://abc123@glitchtip.example/2')?.origin).not.toContain('abc123');
	});

	it('liefert null für Unbrauchbares', () => {
		expect(parseDsn(undefined)).toBeNull();
		expect(parseDsn('')).toBeNull();
		expect(parseDsn('nonsense')).toBeNull();
		// Ohne Projekt-Nummer gibt es kein Ziel.
		expect(parseDsn('https://abc123@glitchtip.example/')).toBeNull();
		// Kein http(s) — der Tunnel würde sonst beliebige Schemata weiterreichen.
		expect(parseDsn('file:///etc/passwd')).toBeNull();
	});
});
