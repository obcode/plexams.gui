import { describe, it, expect } from 'vitest';
import { buildGroups, hasTime } from './otherFkGroups';

const item = (over: Record<string, any> = {}) => ({
	source: 'zpa',
	ancode: 100,
	fk: 'FK10',
	module: 'M',
	planEntry: null,
	...over
});

describe('hasTime', () => {
	it('true nur bei gesetzter externalTime', () => {
		expect(hasTime({ planEntry: { externalTime: '2026-07-06T11:00:00+02:00' } })).toBe(true);
		expect(hasTime({ planEntry: { externalTime: null } })).toBe(false);
		expect(hasTime({ planEntry: null })).toBe(false);
	});
});

describe('buildGroups', () => {
	it('gruppiert nach FK, alphabetisch, Prüfungen nach Ancode', () => {
		const groups = buildGroups([
			item({ fk: 'FK10', ancode: 200 }),
			item({ fk: 'FK03', ancode: 101, source: 'mucdai' }),
			item({ fk: 'FK10', ancode: 100 })
		]);
		expect(groups.map((g) => g.fk)).toEqual(['FK03', 'FK10']);
		expect(groups[1].exams.map((e) => e.ancode)).toEqual([100, 200]);
	});

	it('leere FK landet unter „—"', () => {
		const groups = buildGroups([item({ fk: '' })]);
		expect(groups[0].fk).toBe('—');
	});

	it('source-Filter', () => {
		const items = [item({ source: 'zpa' }), item({ source: 'mucdai', ancode: 101 })];
		expect(buildGroups(items, { source: 'mucdai' })).toHaveLength(1);
		expect(buildGroups(items, { source: 'mucdai' })[0].exams[0].sourceLabel).toBe('MUC.DAI');
	});

	it('fk-Filter', () => {
		const items = [item({ fk: 'FK10' }), item({ fk: 'FK03', ancode: 101 })];
		expect(buildGroups(items, { fk: 'FK03' })).toHaveLength(1);
	});

	it('onlyMissing blendet Prüfungen mit Zeit aus', () => {
		const items = [
			item({ ancode: 100, planEntry: { externalTime: '2026-07-06T11:00:00+02:00' } }),
			item({ ancode: 101, planEntry: null })
		];
		const groups = buildGroups(items, { onlyMissing: true });
		expect(groups[0].exams.map((e) => e.ancode)).toEqual([101]);
	});

	it('extra kombiniert Programm + Gruppen', () => {
		const groups = buildGroups([item({ program: 'DE', groups: ['G1'] })]);
		expect(groups[0].exams[0].extra).toEqual(['DE', 'G1']);
	});
});
