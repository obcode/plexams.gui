import { describe, it, expect } from 'vitest';
import {
	filterTodos,
	formatDate,
	isOverdue,
	linkParam,
	openTodosPerPhase,
	overdueFirst,
	parseLabels,
	parseLinkParam,
	previousSemester,
	todayISO
} from './todo.js';

/** @param {Partial<import('./todo.js').Todo>} t @returns {import('./todo.js').Todo} */
const todo = (t) => ({
	id: 1,
	title: '',
	description: '',
	priority: 'NORMAL',
	dueDate: null,
	labels: [],
	recurring: false,
	done: false,
	links: [],
	commentCount: 0,
	...t
});

describe('previousSemester', () => {
	it('springt zwischen SS und WS', () => {
		expect(previousSemester('2026-WS')).toBe('2026-SS');
		expect(previousSemester('2026-SS')).toBe('2025-WS');
	});
	it('liefert null für Unbekanntes', () => {
		expect(previousSemester('2026 WS')).toBeNull();
		expect(previousSemester(null)).toBeNull();
	});
});

describe('Link-Parameter', () => {
	it('hin und zurück', () => {
		const link = { kind: 'PHASE', key: 'phase1' };
		expect(parseLinkParam(linkParam(link))).toEqual(link);
	});
	it('Schlüssel darf Doppelpunkte enthalten (URLs)', () => {
		expect(parseLinkParam('URL:https://hm.edu')).toEqual({ kind: 'URL', key: 'https://hm.edu' });
	});
	it('lehnt Unvollständiges ab', () => {
		expect(parseLinkParam('PHASE:')).toBeNull();
		expect(parseLinkParam(':x')).toBeNull();
		expect(parseLinkParam('')).toBeNull();
	});
});

describe('Datum', () => {
	it('formatiert und erkennt Überfälliges', () => {
		expect(formatDate('2026-12-24')).toBe('24.12.2026');
		expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(isOverdue(todo({ dueDate: '2026-01-04' }), '2026-01-05')).toBe(true);
		expect(isOverdue(todo({ dueDate: '2026-01-05' }), '2026-01-05')).toBe(false);
		expect(isOverdue(todo({ dueDate: '2026-01-04', done: true }), '2026-01-05')).toBe(false);
	});
});

describe('filterTodos', () => {
	const todos = [
		todo({
			id: 1,
			title: 'Raum klären',
			labels: ['räume'],
			links: [{ kind: 'EXAM', key: '100', label: '100. Mathe' }]
		}),
		todo({ id: 2, title: 'Mail', done: true, priority: 'HIGH' }),
		todo({ id: 3, title: 'Aufsicht', description: 'Müller fragen' })
	];
	const ids = (/** @type {any} */ f) => filterTodos(todos, f).map((t) => t.id);

	it('nach Status', () => {
		expect(ids({ status: 'open' })).toEqual([1, 3]);
		expect(ids({ status: 'done' })).toEqual([2]);
		expect(ids({ status: 'all' })).toEqual([1, 2, 3]);
	});
	it('nach Label, Priorität, Link-Art und Link', () => {
		expect(ids({ label: 'räume' })).toEqual([1]);
		expect(ids({ priority: 'HIGH' })).toEqual([2]);
		expect(ids({ kind: 'EXAM' })).toEqual([1]);
		expect(ids({ link: { kind: 'EXAM', key: '100' } })).toEqual([1]);
		expect(ids({ link: { kind: 'EXAM', key: '200' } })).toEqual([]);
	});
	it('Volltext auch in Beschreibung und Link-Namen', () => {
		expect(ids({ text: 'müller' })).toEqual([3]);
		expect(ids({ text: 'mathe' })).toEqual([1]);
	});
});

describe('Startseite', () => {
	it('Überfälliges zuerst, sonst stabil', () => {
		const t = [
			todo({ id: 1 }),
			todo({ id: 2, dueDate: '2026-01-01' }),
			todo({ id: 3 }),
			todo({ id: 4, dueDate: '2025-12-01' })
		];
		expect(overdueFirst(t, '2026-02-01').map((x) => x.id)).toEqual([2, 4, 1, 3]);
	});
	it('zählt offene Todos je Phase über Phase und Planungsschritte', () => {
		const phases = [
			{ key: 'phase1', conditions: [{ key: 'draftSent' }] },
			{ key: 'phase2', conditions: [] }
		];
		const t = [
			todo({ links: [{ kind: 'PHASE', key: 'phase1' }] }),
			todo({ links: [{ kind: 'CONDITION', key: 'draftSent' }] }),
			todo({ done: true, links: [{ kind: 'PHASE', key: 'phase1' }] }),
			todo({ links: [{ kind: 'EXAM', key: 'phase2' }] })
		];
		expect(openTodosPerPhase(t, phases)).toEqual({ phase1: 2, phase2: 0 });
	});
});

describe('parseLabels', () => {
	it('trimmt und entfernt Leere und Doppelte', () => {
		expect(parseLabels(' a, b ,, a')).toEqual(['a', 'b']);
	});
});
