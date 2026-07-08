import { describe, it, expect } from 'vitest';
import { dateKey, dayNumberForTime, slotNumberForTime, inPeriod } from './derive';

// Nummern werden aus der Array-Position abgeleitet (1-basiert), ExamDay/Starttime
// tragen kein `number`-Feld mehr.
const days = [{ date: '2026-07-06T00:00:00+02:00' }, { date: '2026-07-07T00:00:00+02:00' }];
const starttimes = [{ start: '08:30' }, { start: '11:00' }];

describe('dateKey', () => {
	it('liefert den Kalendertag', () => {
		expect(dateKey('2026-07-06T11:00:00+02:00')).toBe('2026-07-06');
		expect(dateKey(null)).toBe('');
	});
});

describe('dayNumberForTime', () => {
	it('matcht den Prüfungstag über das Datum', () => {
		expect(dayNumberForTime('2026-07-07T08:30:00+02:00', days)).toBe(2);
	});
	it('0 außerhalb des Zeitraums', () => {
		expect(dayNumberForTime('2026-08-01T08:30:00+02:00', days)).toBe(0);
		expect(dayNumberForTime(null, days)).toBe(0);
	});
});

describe('slotNumberForTime', () => {
	it('matcht die Standard-Anfangszeit über die Uhrzeit', () => {
		expect(slotNumberForTime('2026-07-06T11:00:00+02:00', starttimes)).toBe(2);
	});
	it('0 bei Nicht-Standard-Uhrzeit', () => {
		expect(slotNumberForTime('2026-07-06T09:15:00+02:00', starttimes)).toBe(0);
	});
});

describe('inPeriod', () => {
	it('true innerhalb, false außerhalb', () => {
		expect(inPeriod('2026-07-06T11:00:00+02:00', days)).toBe(true);
		expect(inPeriod('2026-08-01T11:00:00+02:00', days)).toBe(false);
	});
});
