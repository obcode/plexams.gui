import { describe, it, expect, vi, beforeEach } from 'vitest';

// $env (SvelteKit-Virtual) und graphql-request mocken, damit der Helfer ohne
// Backend testbar ist. gqlProxy geht über $lib/server/backend → GraphQLClient.
vi.mock('$env/dynamic/private', () => ({ env: { PLEXAMS_SERVER: 'http://test/query' } }));
const requestMock = vi.fn();
const clientCtor = vi.fn();
vi.mock('graphql-request', () => ({
	GraphQLClient: class {
		constructor(url: string, opts: unknown) {
			clientCtor(url, opts);
		}
		request(...a: unknown[]) {
			return requestMock(...a);
		}
	}
}));

import { gqlProxy } from './gqlProxy';

beforeEach(() => {
	requestMock.mockReset();
	clientCtor.mockReset();
});

describe('gqlProxy', () => {
	it('reicht Dokument + Variablen ans Backend und gibt die Daten als JSON zurück', async () => {
		requestMock.mockResolvedValueOnce({ foo: 1 });
		const res = await gqlProxy('query { foo }', { a: 1 });
		expect(clientCtor).toHaveBeenCalledWith('http://test/query', { headers: {} });
		expect(requestMock).toHaveBeenCalledWith('query { foo }', { a: 1 });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ foo: 1 });
	});

	it('mappt Backend-Fehler auf HTTP 400 mit lesbarem error-Feld', async () => {
		requestMock.mockRejectedValueOnce(new Error('boom'));
		const res = await gqlProxy('mutation { x }');
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toContain('boom');
	});
});
