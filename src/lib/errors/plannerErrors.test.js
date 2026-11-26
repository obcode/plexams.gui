import { describe, expect, it } from 'vitest';
import { httpErrorMessage, KNOWN_CODES, plannerErrorMessage } from '#lib/errors/plannerErrors.js';
import { streamErrorMessage, streamFailureMessage, stripAnsi } from '#lib/errors/streamErrors.js';

// The codes plexams.go declares in plexams/apierr/apierr.go. A code added there needs
// a message here, otherwise the planner reads the backend's raw text.
const BACKEND_CODES = [
	'FORBIDDEN',
	'READ_ONLY_ROLE',
	'SEMESTER_READ_ONLY',
	'BUSY',
	'PUBLISHED_LOCKED',
	'ALREADY_SENT',
	'ALREADY_EXISTS',
	'NOT_FOUND',
	'INVALID_INPUT',
	'EXTERNAL_ZPA',
	'EXTERNAL_ANNY',
	'EXTERNAL_SMTP',
	'INTERNAL'
];

describe('plannerErrorMessage', () => {
	it('has a message for every code of the planning API', () => {
		expect(BACKEND_CODES.filter((c) => !KNOWN_CODES.includes(c))).toEqual([]);
	});

	it('replaces the backend text where it adds nothing for a planner', () => {
		const msg = plannerErrorMessage('SEMESTER_READ_ONLY', 'semester is read-only');
		expect(msg).toContain('geschützt');
		expect(msg).not.toContain('read-only');
	});

	it('never shows database details for an internal fault', () => {
		expect(plannerErrorMessage('INTERNAL', 'no rows in result set')).not.toContain('rows');
	});

	it('keeps the detail where it names what is wrong', () => {
		expect(plannerErrorMessage('INVALID_INPUT', 'Datum liegt vor Semesterbeginn')).toBe(
			'Die Eingabe passt so nicht: Datum liegt vor Semesterbeginn'
		);
	});

	it('passes an uncoded message through, without the stream prefix', () => {
		expect(plannerErrorMessage(undefined, 'error: Raum R1 ist belegt')).toBe('Raum R1 ist belegt');
	});

	it('says something even without code and text', () => {
		expect(plannerErrorMessage(null, '')).toBe('Unbekannter Fehler.');
	});
});

describe('httpErrorMessage', () => {
	it('explains the statuses the backend uses on purpose', () => {
		expect(httpErrorMessage(423)).toContain('geschützt');
		expect(httpErrorMessage(409)).toContain('im Hintergrund');
		expect(httpErrorMessage(403)).toContain('Zugang');
	});

	it('names the status for everything else', () => {
		expect(httpErrorMessage(502)).toContain('(HTTP 502)');
		expect(httpErrorMessage(404)).toContain('(HTTP 404)');
	});
});

describe('stream errors', () => {
	it('strips terminal colours', () => {
		expect(stripAnsi('\u001b[31mrot\u001b[0m')).toBe('rot');
	});

	it('translates a coded ERROR line', () => {
		const msg = streamErrorMessage({
			text: 'error: generation is locked',
			code: 'PUBLISHED_LOCKED'
		});
		expect(msg).toContain('veröffentlicht');
		expect(msg).not.toContain('locked');
	});

	it('explains a broken connection instead of showing the socket error', () => {
		expect(streamFailureMessage(new Error('socket hang up'))).toContain('Verbindung');
		expect(streamFailureMessage({ reason: '' })).toContain('Verbindung');
	});

	it('translates GraphQL errors of the subscription itself', () => {
		expect(
			streamFailureMessage([{ message: 'forbidden', extensions: { code: 'READ_ONLY_ROLE' } }])
		).toContain('nur lesen');
	});
});
