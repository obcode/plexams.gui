import { describe, it, expect, vi, beforeEach } from 'vitest';

// $lib/server/backend mocken: authContext ist ein simpler run(store, cb) => cb()
// (die echte ALS-Weiterreichung ist hier irrelevant, backendRequest ist gemockt),
// backendRequest liefert pro Test das gewünschte `me`-Ergebnis bzw. wirft.
const { mockBackendRequest } = vi.hoisted(() => ({ mockBackendRequest: vi.fn() }));
vi.mock('$lib/server/backend', () => ({
	authContext: { run: (/** @type {any} */ _store, /** @type {any} */ cb) => cb() },
	backendRequest: (/** @type {any} */ d, /** @type {any} */ v) => mockBackendRequest(d, v)
}));

import { handle } from './hooks.server.js';

/**
 * @param {string} pathname
 * @param {Record<string, string>} headers
 * @param {string} method
 * @returns {any} vereinfachtes RequestEvent (nur die im Handle benutzten Felder)
 */
function makeEvent(pathname, headers = {}, method = 'GET') {
	return {
		request: { method, headers: new Headers(headers) },
		url: new URL('http://localhost' + pathname),
		locals: {}
	};
}

const okResolve = vi.fn(async () => new Response('page', { status: 200 }));

beforeEach(() => {
	mockBackendRequest.mockReset();
	okResolve.mockClear();
});

describe('handle — Zugangs-Riegel', () => {
	it('ohne X-Remote-User (Dev): kein me-Check, Seite wird ausgeliefert', async () => {
		const event = makeEvent('/plan/exams');
		const res = await handle({ event, resolve: okResolve });
		expect(mockBackendRequest).not.toHaveBeenCalled();
		expect(okResolve).toHaveBeenCalled();
		expect(res.status).toBe(200);
	});

	it('freigeschaltete Kennung (me.email vorhanden): Seite wird ausgeliefert', async () => {
		mockBackendRequest.mockResolvedValue({ me: { email: 'ok@hm.edu' } });
		const event = makeEvent('/plan/exams', { 'x-remote-user': 'ok@hm.edu' });
		const res = await handle({ event, resolve: okResolve });
		expect(okResolve).toHaveBeenCalled();
		expect(res.status).toBe(200);
	});

	it('Backend lehnt ab (ClientError mit response): 403-„Kein Zutritt"-HTML, kein resolve', async () => {
		mockBackendRequest.mockRejectedValue({ response: { errors: [{ message: 'forbidden' }] } });
		const event = makeEvent('/plan/exams', { 'x-remote-user': 'nope@hm.edu' });
		const res = await handle({ event, resolve: okResolve });
		expect(okResolve).not.toHaveBeenCalled();
		expect(res.status).toBe(403);
		expect(res.headers.get('content-type')).toContain('text/html');
		expect(await res.text()).toContain('nope@hm.edu');
	});

	it('abgelehnt auf /api: 403-JSON statt HTML', async () => {
		mockBackendRequest.mockRejectedValue({ response: { errors: [{ message: 'forbidden' }] } });
		const event = makeEvent('/api/exam/foo', { 'x-remote-user': 'apinope@hm.edu' });
		const res = await handle({ event, resolve: okResolve });
		expect(okResolve).not.toHaveBeenCalled();
		expect(res.status).toBe(403);
		expect(res.headers.get('content-type')).toContain('application/json');
	});

	it('Backend nicht erreichbar (Netzwerkfehler ohne response): NICHT sperren', async () => {
		mockBackendRequest.mockRejectedValue(new Error('ECONNREFUSED'));
		const event = makeEvent('/plan/exams', { 'x-remote-user': 'netdown@hm.edu' });
		const res = await handle({ event, resolve: okResolve });
		expect(okResolve).toHaveBeenCalled();
		expect(res.status).toBe(200);
	});
});
