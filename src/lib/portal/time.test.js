import { describe, expect, it } from 'vitest';
import { formatBerlin } from './time';

describe('formatBerlin', () => {
	it('zeigt Berliner Zeit, unabhängig von der Zeitzone des Servers', () => {
		expect(formatBerlin('2027-01-29T22:59:00Z')).toBe('29.01.2027, 23:59');
		expect(formatBerlin('2027-07-12T06:30:00Z')).toBe('12.07.2027, 08:30');
	});
	it('leer bei fehlendem oder ungültigem Wert', () => {
		expect(formatBerlin(null)).toBe('');
		expect(formatBerlin('kaputt')).toBe('');
	});
});
