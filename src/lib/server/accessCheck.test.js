import { describe, expect, it, vi } from 'vitest';
import { classifyError, combine, createAccessCheck, decide } from './accessCheck';

const rejected = Object.assign(new Error('forbidden'), { response: { status: 403 } });
const notMounted = Object.assign(new Error('not found'), { response: { status: 404 } });
const serverError = Object.assign(new Error('cannot verify user'), { response: { status: 500 } });
const graphQLError = Object.assign(new Error('x'), { response: { status: 200, errors: [{}] } });
const network = new Error('ECONNREFUSED');

/** @param {any} data */
const ok = (data) => /** @type {const} */ ({ ok: true, data });
/** @param {any} error */
const fail = (error) => /** @type {const} */ ({ ok: false, error });

const me = ok({ me: { email: 'a@hm.edu' } });
const session = ok({ session: { email: 'a@hm.edu', teachers: [{ id: 1 }] } });

describe('classifyError', () => {
	it('unterscheidet Ablehnung von Ausfall', () => {
		expect(classifyError(rejected)).toBe('denied');
		expect(classifyError(notMounted)).toBe('denied');
		expect(classifyError(graphQLError)).toBe('denied');
		expect(classifyError(serverError)).toBe('unavailable');
		expect(classifyError(network)).toBe('unavailable');
	});
});

describe('combine', () => {
	it('Planungsrolle, mit oder ohne Portal', () => {
		expect(combine(me, session)).toEqual({ access: 'staff', session: session.data.session });
		expect(combine(me, fail(notMounted))).toEqual({ access: 'staff', session: undefined });
	});
	it('nur Portal', () => {
		expect(combine(fail(rejected), session)).toEqual({
			access: 'portal',
			session: session.data.session
		});
	});
	it('ein Backend ohne Portal (404) heißt Ablehnung, nicht Ausfall', () => {
		expect(combine(fail(rejected), fail(notMounted)).access).toBe('denied');
	});
	it('ein Ausfall der Planung ist ein Ausfall', () => {
		expect(combine(fail(serverError), session).access).toBe('unavailable');
		expect(combine(fail(rejected), fail(network)).access).toBe('unavailable');
	});
});

describe('decide', () => {
	it('Planung darf alles', () => {
		for (const path of ['/', '/plan/exams', '/api/exam/x', '/portal']) {
			expect(decide('staff', path)).toBe('pass');
		}
	});
	it('Portal-Kennungen nur ins Portal', () => {
		expect(decide('portal', '/portal')).toBe('pass');
		expect(decide('portal', '/portal/2027-SS/exahm-seb')).toBe('pass');
		expect(decide('portal', '/monitoring')).toBe('pass');
		expect(decide('portal', '/')).toBe('to-portal');
		expect(decide('portal', '/plan/exams')).toBe('portal-only');
		expect(decide('portal', '/api/exam/x')).toBe('portal-only');
		expect(decide('portal', '/portalx')).toBe('portal-only');
	});
	it('Ablehnung und Ausfall', () => {
		expect(decide('denied', '/portal')).toBe('deny');
		expect(decide('unavailable', '/')).toBe('unavailable');
	});
});

/** @param {(user: string) => Promise<any>} probe */
function setup(probe) {
	let t = 0;
	const clock = { now: () => t, advance: (/** @type {number} */ ms) => (t += ms) };
	const check = createAccessCheck({ probe, now: clock.now, maxEntries: 3 });
	return { check, clock };
}

const staff = { access: 'staff' };

describe('createAccessCheck', () => {
	it('fragt je Kennung höchstens einmal in 30 s', async () => {
		const probe = vi.fn(async () => staff);
		const { check, clock } = setup(probe);
		for (const user of ['a', 'b', 'a', 'b', 'a']) await check(user);
		expect(probe).toHaveBeenCalledTimes(2);
		clock.advance(31_000);
		await check('a');
		expect(probe).toHaveBeenCalledTimes(3);
	});

	it('legt gleichzeitige Anfragen derselben Kennung zusammen', async () => {
		/** @type {(v: any) => void} */
		let resolve = () => {};
		const probe = vi.fn(() => new Promise((r) => (resolve = r)));
		const { check } = setup(probe);
		const results = Promise.all([check('a'), check('a'), check('a')]);
		resolve(staff);
		expect((await results).map((r) => r.access)).toEqual(['staff', 'staff', 'staff']);
		expect(probe).toHaveBeenCalledTimes(1);
	});

	it('ein Wurf der Probe heißt nicht erreichbar', async () => {
		const { check } = setup(async () => {
			throw network;
		});
		expect((await check('a')).access).toBe('unavailable');
	});

	it('bekannte Kennung arbeitet bei einem Ausfall mit dem letzten Stand weiter', async () => {
		const probe = vi.fn(
			async () => /** @type {any} */ ({ access: 'portal', session: { email: 'a' } })
		);
		const { check, clock } = setup(probe);
		expect((await check('a')).access).toBe('portal');
		probe.mockResolvedValue({ access: 'unavailable' });
		clock.advance(60_000);
		expect((await check('a')).access).toBe('portal');
		clock.advance(10 * 60_000);
		expect((await check('a')).access).toBe('unavailable');
	});

	it('eine gesperrte Kennung bleibt auch bei einem Ausfall gesperrt', async () => {
		const probe = vi.fn(async () => /** @type {any} */ ({ access: 'denied' }));
		const { check, clock } = setup(probe);
		expect((await check('x')).access).toBe('denied');
		probe.mockResolvedValue({ access: 'unavailable' });
		clock.advance(60_000);
		expect((await check('x')).access).toBe('denied');
	});

	it('hält höchstens maxEntries Kennungen', async () => {
		const probe = vi.fn(async () => staff);
		const { check } = setup(probe);
		for (const user of ['a', 'b', 'c', 'd']) await check(user);
		await check('a'); // verdrängt
		expect(probe).toHaveBeenCalledTimes(5);
		await check('d'); // noch im Cache
		expect(probe).toHaveBeenCalledTimes(5);
	});
});
