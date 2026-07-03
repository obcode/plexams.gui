import { describe, it, expect } from 'vitest';
import { dateObj, isoWeekday, mondayOf, isoWeekNum, ddmm, minutesOfDay, hhmm } from './calendar';

describe('dateObj', () => {
	it('parst yyyy-mm-dd als UTC-Mitternacht', () => {
		const d = dateObj('2026-07-06T11:00:00+02:00');
		expect(d?.toISOString()).toBe('2026-07-06T00:00:00.000Z');
	});
	it('liefert null bei ungültigem/leerem Input', () => {
		expect(dateObj('')).toBeNull();
		expect(dateObj(null)).toBeNull();
		expect(dateObj('foo')).toBeNull();
	});
});

describe('isoWeekday', () => {
	it('Mo=1 … So=7', () => {
		expect(isoWeekday(new Date(Date.UTC(2026, 6, 6)))).toBe(1); // Montag
		expect(isoWeekday(new Date(Date.UTC(2026, 6, 12)))).toBe(7); // Sonntag
	});
});

describe('mondayOf', () => {
	it('liefert den Montag der Woche', () => {
		expect(
			mondayOf(new Date(Date.UTC(2026, 6, 9)))
				.toISOString()
				.slice(0, 10)
		).toBe('2026-07-06');
		expect(
			mondayOf(new Date(Date.UTC(2026, 6, 6)))
				.toISOString()
				.slice(0, 10)
		).toBe('2026-07-06');
	});
});

describe('isoWeekNum', () => {
	it('berechnet die ISO-Kalenderwoche', () => {
		expect(isoWeekNum(new Date(Date.UTC(2026, 6, 6)))).toBe(28);
		// Jahreswechsel-Kante: 2021-01-01 (Fr) gehört zu KW 53/2020
		expect(isoWeekNum(new Date(Date.UTC(2021, 0, 1)))).toBe(53);
		// 2026-01-01 (Do) ist KW 1
		expect(isoWeekNum(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
	});
});

describe('ddmm', () => {
	it('formatiert dd.mm. mit führenden Nullen', () => {
		expect(ddmm(new Date(Date.UTC(2026, 6, 6)))).toBe('06.07.');
	});
});

describe('minutesOfDay', () => {
	it('liest die Wanduhrzeit aus dem ISO-String', () => {
		expect(minutesOfDay('2026-07-06T11:00:00+02:00')).toBe(11 * 60);
		expect(minutesOfDay('2026-07-06T14:30:00+02:00')).toBe(14 * 60 + 30);
	});
	it('liefert null ohne Zeitanteil', () => {
		expect(minutesOfDay('2026-07-06')).toBeNull();
		expect(minutesOfDay(null)).toBeNull();
	});
});

describe('hhmm', () => {
	it('formatiert Minuten als HH:MM', () => {
		expect(hhmm(11 * 60)).toBe('11:00');
		expect(hhmm(14 * 60 + 30)).toBe('14:30');
		expect(hhmm(8 * 60 + 5)).toBe('08:05');
	});
});
