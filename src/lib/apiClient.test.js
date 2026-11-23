import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, postApi } from './apiClient';

/** @param {number} status @param {any} body */
function mockFetch(status, body) {
	const fetchMock = vi.fn(async () => ({
		ok: status >= 200 && status < 300,
		status,
		json: async () => {
			if (body instanceof Error) throw body;
			return body;
		}
	}));
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('postApi', () => {
	it('posts JSON and returns the data', async () => {
		const fetchMock = mockFetch(200, { examsAt: [{ ancode: 1 }] });
		const data = await postApi('/api/slot/examsAt', { starttime: 'x' });
		expect(data.examsAt).toEqual([{ ancode: 1 }]);
		expect(fetchMock).toHaveBeenCalledWith('/api/slot/examsAt', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ starttime: 'x' })
		});
	});

	// gqlProxy: HTTP 400 + { error } — früher landete hier `undefined` im State
	it('throws the backend message on a proxied GraphQL error', async () => {
		mockFetch(400, { error: 'no rows in result set' });
		await expect(postApi('/api/slot/examsAt')).rejects.toThrow('no rows in result set');
	});

	it('throws on an error field even with HTTP 200', async () => {
		mockFetch(200, { error: 'kaputt' });
		await expect(postApi('/api/slot/examsAt')).rejects.toThrow('kaputt');
	});

	it('throws with the HTTP status when the body is not JSON', async () => {
		mockFetch(502, new SyntaxError('Unexpected token <'));
		await expect(postApi('/api/slot/examsAt')).rejects.toThrow('Fehler (HTTP 502)');
	});
});

describe('errorMessage', () => {
	it('takes the message of an Error and stringifies anything else', () => {
		expect(errorMessage(new Error('weg'))).toBe('weg');
		expect(errorMessage('roh')).toBe('roh');
	});
});
