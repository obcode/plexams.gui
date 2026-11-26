import { describe, expect, it } from 'vitest';
import { UNREACHABLE_MESSAGE } from '#lib/errors/plannerErrors.js';
import { clientErrorMessage, UNREADABLE_MESSAGE } from '#lib/errors/clientErrors.js';
import { ApiError } from '#lib/apiClient.js';

describe('clientErrorMessage', () => {
	it('explains a failed fetch in every browser', () => {
		for (const m of [
			'Failed to fetch',
			'NetworkError when attempting to fetch resource.',
			'Load failed'
		]) {
			expect(clientErrorMessage(new TypeError(m))).toBe(UNREACHABLE_MESSAGE);
		}
	});
	it('explains an unreadable answer', () => {
		expect(clientErrorMessage(new SyntaxError('Unexpected token < in JSON'))).toBe(
			UNREADABLE_MESSAGE
		);
	});
	it('keeps the German message of the backend', () => {
		expect(clientErrorMessage(new ApiError('Raum R1 ist belegt.', 'INVALID_INPUT'))).toBe(
			'Raum R1 ist belegt.'
		);
	});
	it('says that a fault in the page is not the planner’s doing', () => {
		expect(clientErrorMessage(new TypeError('x is undefined'))).toContain('unerwarteter Fehler');
	});
	it('names an abort', () => {
		expect(clientErrorMessage(new DOMException('aborted', 'AbortError'))).toContain('abgebrochen');
	});
});
