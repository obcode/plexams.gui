import { describe, expect, it, vi } from 'vitest';
import { classify, createAccessCheck } from './accessCheck';

const allowed = { me: { email: 'a@hm.edu' } };
const rejected = Object.assign(new Error('forbidden'), { response: { status: 403 } });
const serverError = Object.assign(new Error('cannot verify user'), { response: { status: 500 } });
const graphQLError = Object.assign(new Error('x'), { response: { status: 200, errors: [{}] } });
const network = new Error('ECONNREFUSED');

describe('classify', () => {
	it('unterscheidet Ablehnung von Ausfall', () => {
		expect(classify({ ok: true, data: allowed })).toBe('allowed');
		expect(classify({ ok: true, data: {} })).toBe('denied');
		expect(classify({ ok: false, error: rejected })).toBe('denied');
		expect(classify({ ok: false, error: graphQLError })).toBe('denied');
		expect(classify({ ok: false, error: serverError })).toBe('unavailable');
		expect(classify({ ok: false, error: network })).toBe('unavailable');
	});
});

/** @param {(user: string) => Promise<any>} probe */
function setup(probe) {
	let t = 0;
	const clock = { now: () => t, advance: (/** @type {number} */ ms) => (t += ms) };
	const check = createAccessCheck({ probe, now: clock.now, maxEntries: 3 });
	return { check, clock };
}

describe('createAccessCheck', () => {
	it('fragt je Kennung höchstens einmal in 30 s', async () => {
		const probe = vi.fn(async () => allowed);
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
		resolve(allowed);
		expect(await results).toEqual(['allowed', 'allowed', 'allowed']);
		expect(probe).toHaveBeenCalledTimes(1);
	});

	it('ein Serverfehler ist kein „Kein Zutritt"', async () => {
		const { check } = setup(async () => {
			throw serverError;
		});
		expect(await check('a')).toBe('unavailable');
	});

	it('bekannte Kennung arbeitet bei einem Ausfall mit dem letzten Stand weiter', async () => {
		const probe = vi.fn(async () => allowed);
		const { check, clock } = setup(probe);
		expect(await check('a')).toBe('allowed');
		probe.mockRejectedValue(network);
		clock.advance(60_000);
		expect(await check('a')).toBe('allowed');
		clock.advance(10 * 60_000);
		expect(await check('a')).toBe('unavailable');
	});

	it('eine gesperrte Kennung bleibt auch bei einem Ausfall gesperrt', async () => {
		const probe = vi.fn(async () => {
			throw rejected;
		});
		const { check, clock } = setup(probe);
		expect(await check('x')).toBe('denied');
		probe.mockRejectedValue(network);
		clock.advance(60_000);
		expect(await check('x')).toBe('denied');
	});

	it('hält höchstens maxEntries Kennungen', async () => {
		const probe = vi.fn(async () => allowed);
		const { check } = setup(probe);
		for (const user of ['a', 'b', 'c', 'd']) await check(user);
		await check('a'); // verdrängt
		expect(probe).toHaveBeenCalledTimes(5);
		await check('d'); // noch im Cache
		expect(probe).toHaveBeenCalledTimes(5);
	});
});
