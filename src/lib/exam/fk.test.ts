import { describe, it, expect } from 'vitest';
import { normalizeFk, planningFk, displayAncode } from './fk';

describe('normalizeFk', () => {
	it('setzt „FK" vor rein numerische Kennungen', () => {
		expect(normalizeFk('10')).toBe('FK10');
		expect(normalizeFk(' 3 ')).toBe('FK3');
	});
	it('lässt bereits präfixierte / leere Werte unverändert', () => {
		expect(normalizeFk('FK03')).toBe('FK03');
		expect(normalizeFk('')).toBe('');
		expect(normalizeFk(null)).toBe('');
		expect(normalizeFk(undefined)).toBe('');
	});
});

describe('planningFk', () => {
	it('bevorzugt die Fakultät der Prüfung', () => {
		expect(planningFk('FK03', '10')).toBe('FK03');
	});
	it('fällt auf das Constraint-Feld zurück (normalisiert)', () => {
		expect(planningFk('', '10')).toBe('FK10');
		expect(planningFk(null, '10')).toBe('FK10');
	});
	it('liefert leer, wenn nichts gesetzt ist (eigene FK07)', () => {
		expect(planningFk('', '')).toBe('');
	});
});

describe('displayAncode', () => {
	it('zeigt mit FK die Primuss-Ancode', () => {
		expect(displayAncode('FK10', 456, 999)).toBe('FK10: 456');
	});
	it('fällt mit FK aber ohne Primuss-Ancode auf die ZPA-Ancode zurück', () => {
		expect(displayAncode('FK10', null, 999)).toBe('FK10: 999');
		expect(displayAncode('FK10', undefined, 999)).toBe('FK10: 999');
	});
	it('zeigt ohne FK die ZPA-Ancode (nicht die Primuss-Ancode)', () => {
		expect(displayAncode('', 456, 999)).toBe('999');
	});
});
