import { describe, expect, it } from 'vitest';
import { isInteger, isSemester } from './params.js';

describe('semester matcher', () => {
	it('nimmt nur die Form des Backends', () => {
		expect(isSemester('2027-SS')).toBe(true);
		expect(isSemester('2026-WS')).toBe(true);
		for (const bad of ['2027 SS', '27-SS', '2027-ss', '2027-SS/x', ''])
			expect(isSemester(bad)).toBe(false);
	});
});

describe('integer matcher', () => {
	it('nimmt nur Ziffern', () => {
		expect(isInteger('0')).toBe(true);
		expect(isInteger('1234')).toBe(true);
		for (const bad of ['', '-1', '1.5', '12a', ' 1']) expect(isInteger(bad)).toBe(false);
	});
});
