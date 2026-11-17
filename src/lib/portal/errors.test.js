import { describe, expect, it } from 'vitest';
import { portalErrorMessage } from './errors';

/** @param {string} code @param {string} [message] */
const apiError = (code, message = '') => ({
	response: { errors: [{ message, extensions: { code } }] }
});

describe('portalErrorMessage', () => {
	it('übersetzt die Codes der Portal-API', () => {
		expect(portalErrorMessage(apiError('READ_ONLY_TOKEN'))).toBe('Dieses Token darf nur lesen.');
		expect(
			portalErrorMessage(apiError('INVALID_INPUT', 'invalid input: a token lives 1 to 365 days'))
		).toBe('Die Eingabe ist ungültig. (a token lives 1 to 365 days)');
	});
	it('unbekannte Ablehnung und Ausfall', () => {
		expect(portalErrorMessage(apiError('SOMETHING_NEW'))).toBe('Die Anfrage wurde abgelehnt.');
		expect(portalErrorMessage(new Error('ECONNREFUSED'))).toBe(
			'Die Prüfungsplanung ist gerade nicht erreichbar.'
		);
	});
});
