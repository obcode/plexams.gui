import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockBackendRequest, mockCaptureException } = vi.hoisted(() => ({
	mockBackendRequest: vi.fn(),
	mockCaptureException: vi.fn()
}));

vi.mock('$lib/server/backend', () => ({
	backendRequest: (/** @type {any} */ d, /** @type {any} */ v) => mockBackendRequest(d, v)
}));

vi.mock('@sentry/sveltekit', () => ({
	captureException: (/** @type {any} */ e, /** @type {any} */ hint) => mockCaptureException(e, hint)
}));

import { gqlProxy } from './gqlProxy';

beforeEach(() => {
	mockBackendRequest.mockReset();
	mockCaptureException.mockReset();
});

describe('gqlProxy', () => {
	it('reicht Daten unverändert durch und meldet nichts', async () => {
		mockBackendRequest.mockResolvedValue({ exams: [{ ancode: 1234 }] });

		const res = await gqlProxy('query { exams { ancode } }');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ exams: [{ ancode: 1234 }] });
		expect(mockCaptureException).not.toHaveBeenCalled();
	});

	// Die Unterscheidung, um die es geht: 128 der 134 /api-Routen enden hier,
	// und die meisten Fehler sind gar keine.
	it('eine Ablehnung des Backends ist eine Warnung, kein Vorfall', async () => {
		mockBackendRequest.mockRejectedValue({
			response: { errors: [{ message: 'forbidden: your role is read-only' }] }
		});

		const res = await gqlProxy('mutation { setExamTime }');

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: 'forbidden: your role is read-only' });
		expect(mockCaptureException).toHaveBeenCalledWith(expect.anything(), { level: 'warning' });
	});

	it('ein nicht erreichbares Backend ist ein Vorfall', async () => {
		mockBackendRequest.mockRejectedValue(new TypeError('fetch failed'));

		const res = await gqlProxy('query { semester { id } }');

		expect(res.status).toBe(400);
		expect(mockCaptureException).toHaveBeenCalledWith(expect.anything(), { level: 'error' });
	});
});
