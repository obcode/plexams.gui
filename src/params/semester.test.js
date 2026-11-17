import { describe, expect, it } from 'vitest';
import { match } from './semester';

describe('semester matcher', () => {
	it('nimmt nur die Form des Backends', () => {
		expect(match('2027-SS')).toBe(true);
		expect(match('2026-WS')).toBe(true);
		for (const bad of ['2027 SS', '27-SS', '2027-ss', '2027-SS/x', ''])
			expect(match(bad)).toBe(false);
	});
});
