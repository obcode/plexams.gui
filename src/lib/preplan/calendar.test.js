import { describe, it, expect } from 'vitest';
import {
	roomColorMap,
	roomOrder,
	ROOM_PALETTE,
	minutesOfIso,
	dateKeyOfIso,
	examBlocks,
	packLanes,
	packByCapacity,
	weekGroups,
	mondayKeyOf,
	dayLabel,
	timeRange,
	PRE_DEFAULT,
	POST_DEFAULT,
	DURATION_DEFAULT
} from './calendar.js';

describe('minutesOfIso / dateKeyOfIso', () => {
	it('liest Minuten und Datum aus einer lokalen ISO-Zeit', () => {
		expect(minutesOfIso('2026-07-13T08:30')).toBe(8 * 60 + 30);
		expect(dateKeyOfIso('2026-07-13T08:30')).toBe('2026-07-13');
	});
	it('liefert null bei fehlender/kaputter Zeit', () => {
		expect(minutesOfIso(null)).toBeNull();
		expect(minutesOfIso('2026-07-13')).toBeNull();
		expect(dateKeyOfIso(undefined)).toBeNull();
	});
});

describe('roomOrder', () => {
	it('hält die feste Reihenfolge 015,016,017,023,021 ein (021 als NTA-Raum zuletzt)', () => {
		expect(roomOrder(['T3.021', 'T3.023', 'T3.015', 'T3.017', 'T3.016'])).toEqual([
			'T3.015',
			'T3.016',
			'T3.017',
			'T3.023',
			'T3.021'
		]);
	});
	it('hängt unbekannte Räume alphabetisch hinter die Prioritätsräume', () => {
		expect(roomOrder(['R9.001', 'T3.021', 'A1.002', 'T3.015'])).toEqual([
			'T3.015',
			'T3.021',
			'A1.002',
			'R9.001'
		]);
	});
	it('dedupliziert und ignoriert leere Werte', () => {
		expect(roomOrder(['T3.015', 'T3.015', null, undefined, ''])).toEqual(['T3.015']);
	});
});

describe('roomColorMap', () => {
	it('färbt in fester Raum-Reihenfolge (021 nach 023)', () => {
		const m = roomColorMap(['T3.021', 'T3.023']);
		expect(m['T3.023']).toBe(ROOM_PALETTE[0]);
		expect(m['T3.021']).toBe(ROOM_PALETTE[1]);
	});

	it('mappt sortierte Räume in die Palette (deterministisch)', () => {
		const m = roomColorMap(['T3.017', 'T3.015', 'T3.015']);
		expect(m['T3.015']).toBe(ROOM_PALETTE[0]);
		expect(m['T3.017']).toBe(ROOM_PALETTE[1]);
	});
	it('rotiert die Palette bei mehr Räumen als Farben', () => {
		const rooms = Array.from(
			{ length: ROOM_PALETTE.length + 1 },
			(_, i) => `R${String(i).padStart(2, '0')}`
		);
		const m = roomColorMap(rooms);
		expect(m[rooms[ROOM_PALETTE.length]]).toBe(ROOM_PALETTE[0]);
	});
});

describe('examBlocks', () => {
	it('baut Fenster mit Vorlauf/Nachlauf und Dauer', () => {
		const [b] = examBlocks([
			{
				id: 1,
				plannedStarttime: '2026-07-13T10:00',
				duration: 60,
				examKind: 'SEB',
				module: 'M',
				constraints: { roomConstraints: { preExamMinutes: 30, postExamMinutes: 20 } }
			}
		]);
		expect(b.dateKey).toBe('2026-07-13');
		expect(b.examStart).toBe(600);
		expect(b.examEnd).toBe(660);
		expect(b.winStart).toBe(570);
		expect(b.winEnd).toBe(680);
		expect(b.durKnown).toBe(true);
	});
	it('nutzt Defaults bei fehlender Dauer / fehlendem Vor-/Nachlauf', () => {
		const [b] = examBlocks([
			{
				id: 2,
				plannedStarttime: '2026-07-13T09:00',
				duration: null,
				examKind: 'EXaHM',
				module: 'X'
			}
		]);
		expect(b.dur).toBe(DURATION_DEFAULT);
		expect(b.durKnown).toBe(false);
		expect(b.winStart).toBe(9 * 60 - PRE_DEFAULT);
		expect(b.winEnd).toBe(9 * 60 + DURATION_DEFAULT + POST_DEFAULT);
	});
	it('lässt nicht eingeplante Prüfungen weg', () => {
		expect(examBlocks([{ id: 3, plannedStarttime: null, module: 'x' }])).toHaveLength(0);
	});
});

describe('packLanes', () => {
	it('legt überlappende Items in getrennte Spuren, disjunkte in dieselbe', () => {
		const { placed, lanes } = packLanes([
			{ start: 0, end: 60 },
			{ start: 30, end: 90 },
			{ start: 60, end: 120 }
		]);
		expect(lanes).toBe(2);
		// erstes und drittes berühren sich nicht → gleiche Spur
		expect(placed[0].lane).toBe(0);
		expect(placed[1].lane).toBe(1);
		expect(placed[2].lane).toBe(0);
	});
	it('liefert mindestens eine Spur bei leerer Eingabe', () => {
		expect(packLanes([]).lanes).toBe(1);
	});
});

describe('packByCapacity', () => {
	it('macht die Breite = Kapazitätsanteil und lässt Rest frei', () => {
		const [a, b] = packByCapacity([
			{ start: 0, end: 60, frac: 0.5 },
			{ start: 0, end: 60, frac: 0.3 }
		]);
		expect(a.left).toBe(0);
		expect(a.width).toBeCloseTo(0.5);
		// zweite Prüfung schließt rechts an → 20 % bleiben frei
		expect(b.left).toBeCloseTo(0.5);
		expect(b.width).toBeCloseTo(0.3);
		expect(b.left + b.width).toBeCloseTo(0.8);
	});
	it('erzwingt eine Mindestbreite für Lesbarkeit', () => {
		const [a] = packByCapacity([{ start: 0, end: 60, frac: 0.01 }], 0.08);
		expect(a.width).toBeCloseTo(0.08);
	});
	it('deckelt die Breite bei 1 (Über-Kapazität)', () => {
		const [a] = packByCapacity([{ start: 0, end: 60, frac: 1.5 }]);
		expect(a.width).toBe(1);
	});
	it('legt zeitlich disjunkte Items beide nach links', () => {
		const placed = packByCapacity([
			{ start: 0, end: 60, frac: 0.5 },
			{ start: 60, end: 120, frac: 0.5 }
		]);
		expect(placed[0].left).toBe(0);
		expect(placed[1].left).toBe(0);
	});
	it('stapelt drei gleichzeitige Prüfungen lückenlos nebeneinander', () => {
		const placed = packByCapacity([
			{ start: 0, end: 60, frac: 0.2 },
			{ start: 0, end: 60, frac: 0.2 },
			{ start: 0, end: 60, frac: 0.2 }
		]);
		expect(placed.map((p) => p.left)).toEqual([0, 0.2, 0.4]);
	});
});

describe('weekGroups', () => {
	it('gruppiert Mo–Fr und hängt Wochenendtage mit Inhalt an', () => {
		const groups = weekGroups(['2026-07-13', '2026-07-15', '2026-07-18']); // Mo, Mi, Sa
		expect(groups).toHaveLength(1);
		const days = groups[0].days.map((d) => d.dateKey);
		expect(days.slice(0, 5)).toEqual([
			'2026-07-13',
			'2026-07-14',
			'2026-07-15',
			'2026-07-16',
			'2026-07-17'
		]);
		expect(days[5]).toBe('2026-07-18'); // Samstag angehängt
	});
	it('trennt verschiedene Wochen und sortiert sie', () => {
		const groups = weekGroups(['2026-07-20', '2026-07-13']);
		expect(groups.map((g) => g.monday)).toEqual(['2026-07-13', '2026-07-20']);
	});
	it('ignoriert leere Keys', () => {
		expect(weekGroups([null, undefined, ''])).toHaveLength(0);
	});
});

describe('mondayKeyOf / dayLabel', () => {
	it('findet den Montag der Woche (auch von einem Sonntag aus)', () => {
		expect(mondayKeyOf('2026-07-15')).toBe('2026-07-13');
		expect(mondayKeyOf('2026-07-19')).toBe('2026-07-13'); // Sonntag
	});
	it('formatiert Wochentag + Datum', () => {
		expect(dayLabel('2026-07-13')).toBe('Mo 13.07.');
	});
});

describe('timeRange', () => {
	it('rundet auf volle Stunden und garantiert min. 2 h', () => {
		expect(timeRange([{ start: 8 * 60 + 10, end: 9 * 60 + 5 }])).toEqual({ lo: 480, hi: 600 });
	});
	it('fällt bei leerer Eingabe auf den Default-Bereich zurück', () => {
		expect(timeRange([])).toEqual({ lo: 8 * 60, hi: 18 * 60 });
	});
});
