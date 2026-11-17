import { describe, it, expect, vi, beforeEach } from 'vitest';

// $lib/server/backend mocken: authContext ist ein simpler run(store, cb) => cb()
// (die echte ALS-Weiterreichung ist hier irrelevant, backendRequest ist gemockt),
// backendRequest liefert pro Test das gewünschte `me`-Ergebnis bzw. wirft.
const { mockBackendRequest, mockPortalProbe } = vi.hoisted(() => ({
	mockBackendRequest: vi.fn(),
	mockPortalProbe: vi.fn()
}));
vi.mock('$lib/server/backend', () => ({
	authContext: { run: (/** @type {any} */ _store, /** @type {any} */ cb) => cb() },
	backendRequest: (/** @type {any} */ d, /** @type {any} */ v) => mockBackendRequest(d, v),
	backendProbe: (/** @type {any} */ d) => mockBackendRequest(d),
	portalProbe: (/** @type {any} */ d) => mockPortalProbe(d)
}));

import { authHandle, allowedOnReadOnlySemester } from './hooks.server.js';

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

// Ein Backend ohne Portal antwortet auf /query/portal mit 404.
const portalNotMounted = Object.assign(new Error('not found'), { response: { status: 404 } });
const plannerRejects = Object.assign(new Error('forbidden'), { response: { status: 403 } });

beforeEach(() => {
	mockBackendRequest.mockReset();
	mockPortalProbe.mockReset();
	mockPortalProbe.mockRejectedValue(portalNotMounted);
	okResolve.mockClear();
});

describe('authHandle — Zugangs-Riegel', () => {
	it('ohne X-Remote-User (Dev): kein me-Check, Seite wird ausgeliefert', async () => {
		const event = makeEvent('/plan/exams');
		const res = await authHandle({ event, resolve: okResolve });
		expect(mockBackendRequest).not.toHaveBeenCalled();
		expect(okResolve).toHaveBeenCalled();
		expect(res.status).toBe(200);
	});

	it('freigeschaltete Kennung (me.email vorhanden): Seite wird ausgeliefert', async () => {
		mockBackendRequest.mockResolvedValue({ me: { email: 'ok@hm.edu' } });
		const event = makeEvent('/plan/exams', { 'x-remote-user': 'ok@hm.edu' });
		const res = await authHandle({ event, resolve: okResolve });
		expect(okResolve).toHaveBeenCalled();
		expect(res.status).toBe(200);
	});

	it('Backend lehnt ab (ClientError mit response): 403-„Kein Zutritt"-HTML, kein resolve', async () => {
		mockBackendRequest.mockRejectedValue({ response: { errors: [{ message: 'forbidden' }] } });
		const event = makeEvent('/plan/exams', { 'x-remote-user': 'nope@hm.edu' });
		const res = await authHandle({ event, resolve: okResolve });
		expect(okResolve).not.toHaveBeenCalled();
		expect(res.status).toBe(403);
		expect(res.headers.get('content-type')).toContain('text/html');
		expect(await res.text()).toContain('nope@hm.edu');
	});

	it('abgelehnt auf /api: 403-JSON statt HTML', async () => {
		mockBackendRequest.mockRejectedValue({ response: { errors: [{ message: 'forbidden' }] } });
		const event = makeEvent('/api/exam/foo', { 'x-remote-user': 'apinope@hm.edu' });
		const res = await authHandle({ event, resolve: okResolve });
		expect(okResolve).not.toHaveBeenCalled();
		expect(res.status).toBe(403);
		expect(res.headers.get('content-type')).toContain('application/json');
	});

	it('Backend nicht erreichbar, Kennung unbekannt: 503-Seite statt „Kein Zutritt"', async () => {
		mockBackendRequest.mockRejectedValue(new Error('ECONNREFUSED'));
		const event = makeEvent('/plan/exams', { 'x-remote-user': 'netdown@hm.edu' });
		const res = await authHandle({ event, resolve: okResolve });
		expect(okResolve).not.toHaveBeenCalled();
		expect(res.status).toBe(503);
		expect(await res.text()).not.toContain('Kein Zutritt');
	});

	it('Serverfehler des Backends (500) ist kein „Kein Zutritt"', async () => {
		mockBackendRequest.mockRejectedValue(
			Object.assign(new Error('cannot verify user'), { response: { status: 500 } })
		);
		const event = makeEvent('/api/exam/foo', { 'x-remote-user': 'dberror@hm.edu' });
		const res = await authHandle({ event, resolve: okResolve });
		expect(res.status).toBe(503);
	});
});

describe('allowedOnReadOnlySemester', () => {
	it('lässt Todo-Proxys und reine Lese-Abfragen durch, sonst nichts', () => {
		expect(allowedOnReadOnlySemester('/api/todo/createTodo')).toBe(true);
		expect(allowedOnReadOnlySemester('/api/todo/addTodoComment')).toBe(true);
		expect(allowedOnReadOnlySemester('/api/semester/setSemester')).toBe(true);
		expect(allowedOnReadOnlySemester('/api/exam/addExam')).toBe(false);
		expect(allowedOnReadOnlySemester('/api/todos-fake')).toBe(false);
	});
});

describe('authHandle — Portal-Kennungen', () => {
	/** @param {string} email */
	function portalOnly(email) {
		mockBackendRequest.mockRejectedValue(plannerRejects);
		mockPortalProbe.mockResolvedValue({ session: { email, teachers: [{ id: 1 }] } });
	}

	it('/ leitet ins Portal um', async () => {
		portalOnly('p1@hm.edu');
		const res = await authHandle({
			event: makeEvent('/', { 'x-remote-user': 'p1@hm.edu' }),
			resolve: okResolve
		});
		expect(res.status).toBe(303);
		expect(res.headers.get('location')).toBe('/portal');
	});

	it('das Portal wird ausgeliefert, mit der Art des Zugangs in locals', async () => {
		portalOnly('p2@hm.edu');
		const event = makeEvent('/portal', { 'x-remote-user': 'p2@hm.edu' });
		const res = await authHandle({ event, resolve: okResolve });
		expect(res.status).toBe(200);
		expect(event.locals.access).toBe('portal');
	});

	it('Planungsseiten und /api sind gesperrt', async () => {
		portalOnly('p3@hm.edu');
		const page = await authHandle({
			event: makeEvent('/plan/exams', { 'x-remote-user': 'p3@hm.edu' }),
			resolve: okResolve
		});
		expect(page.status).toBe(403);
		expect(await page.text()).toContain('/portal');
		const api = await authHandle({
			event: makeEvent('/api/exam/x', { 'x-remote-user': 'p3@hm.edu' }, 'POST'),
			resolve: okResolve
		});
		expect(api.status).toBe(403);
		expect(api.headers.get('content-type')).toContain('application/json');
		expect(okResolve).not.toHaveBeenCalled();
	});

	it('ohne Planungsrolle und ohne Portal: „Kein Zutritt"', async () => {
		mockBackendRequest.mockRejectedValue(plannerRejects);
		const res = await authHandle({
			event: makeEvent('/portal', { 'x-remote-user': 'nobody@hm.edu' }),
			resolve: okResolve
		});
		expect(res.status).toBe(403);
		expect(await res.text()).toContain('Kein Zutritt');
	});
});
