import { describe, it, expect } from 'vitest';
import { starttimeHHMM, isStandardStarttime, combineStarttime } from './setExamTime';

describe('starttimeHHMM', () => {
	it('liest die Ortszeit-Uhrzeit aus einer absoluten Startzeit', () => {
		expect(starttimeHHMM('2026-07-06T11:00:00+02:00')).toBe('11:00');
		expect(starttimeHHMM('2026-07-06T08:30:00Z')).toBe('08:30');
	});
	it('leerer String bei unparsbarer/fehlender Zeit', () => {
		expect(starttimeHHMM(null)).toBe('');
		expect(starttimeHHMM(undefined)).toBe('');
		expect(starttimeHHMM('2026-07-06')).toBe('');
	});
});

describe('isStandardStarttime', () => {
	const standard = ['08:30', '11:00', '14:00'];

	it('true wenn die Uhrzeit einer Standard-Anfangszeit entspricht', () => {
		expect(isStandardStarttime('2026-07-06T11:00:00+02:00', standard)).toBe(true);
		expect(isStandardStarttime('2026-07-06T08:30:00+02:00', standard)).toBe(true);
	});
	it('false bei Nicht-Standard-Zeit', () => {
		expect(isStandardStarttime('2026-07-06T09:15:00+02:00', standard)).toBe(false);
	});
	it('akzeptiert auch Time-Strings als Standardliste', () => {
		expect(isStandardStarttime('2026-07-06T11:00:00+02:00', ['2000-01-01T11:00:00+02:00'])).toBe(
			true
		);
	});
	it('false bei leerer/fehlender Standardliste oder Zeit', () => {
		expect(isStandardStarttime('2026-07-06T11:00:00+02:00', [])).toBe(false);
		expect(isStandardStarttime('2026-07-06T11:00:00+02:00', null)).toBe(false);
		expect(isStandardStarttime(null, standard)).toBe(false);
	});
});

describe('combineStarttime', () => {
	it('übernimmt den Offset aus tzRef und setzt Datum + Uhrzeit', () => {
		expect(combineStarttime('2026-07-06', '09:15', '2026-07-06T00:00:00+02:00')).toBe(
			'2026-07-06T09:15:00+02:00'
		);
	});
	it('akzeptiert einen Time-String als Datum und schneidet auf HH:MM', () => {
		expect(combineStarttime('2026-07-06T00:00:00Z', '11:00:00', '2026-07-06T00:00:00Z')).toBe(
			'2026-07-06T11:00:00Z'
		);
	});
	it("'Z' als Fallback ohne tzRef", () => {
		expect(combineStarttime('2026-07-06', '08:30', null)).toBe('2026-07-06T08:30:00Z');
	});
});
