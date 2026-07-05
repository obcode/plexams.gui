import { describe, it, expect } from 'vitest';
import { lineDiff, diffStat } from './templateDiff';

describe('lineDiff', () => {
	it('gleicher Text → nur Kontextzeilen', () => {
		const rows = lineDiff('a\nb\nc', 'a\nb\nc');
		expect(rows.every((r) => r.type === 'ctx')).toBe(true);
		expect(rows.map((r) => r.text)).toEqual(['a', 'b', 'c']);
	});

	it('geänderte Mittelzeile → del + add, Kontext bleibt', () => {
		const rows = lineDiff('a\nb\nc', 'a\nB\nc');
		expect(rows.map((r) => [r.type, r.text])).toEqual([
			['ctx', 'a'],
			['del', 'b'],
			['add', 'B'],
			['ctx', 'c']
		]);
	});

	it('reine Hinzufügung am Ende', () => {
		const rows = lineDiff('a', 'a\nb');
		expect(rows).toEqual([
			{ type: 'ctx', text: 'a', aLine: 1, bLine: 1 },
			{ type: 'add', text: 'b', aLine: null, bLine: 2 }
		]);
	});

	it('reine Löschung', () => {
		const rows = lineDiff('a\nb', 'a');
		expect(rows.filter((r) => r.type === 'del').map((r) => r.text)).toEqual(['b']);
	});

	it('leer → Text: alles add; Text → leer: alles del', () => {
		expect(lineDiff('', 'x\ny').every((r) => r.type === 'add')).toBe(true);
		expect(lineDiff('x\ny', '').every((r) => r.type === 'del')).toBe(true);
		expect(lineDiff('', '')).toEqual([]);
	});

	it('Zeilennummern verweisen auf die jeweilige Seite', () => {
		const rows = lineDiff('a\nb\nc', 'a\nB\nc');
		expect(rows.find((r) => r.type === 'del')).toMatchObject({ aLine: 2, bLine: null });
		expect(rows.find((r) => r.type === 'add')).toMatchObject({ aLine: null, bLine: 2 });
	});
});

describe('diffStat', () => {
	it('zählt add/del, ignoriert Kontext', () => {
		expect(diffStat(lineDiff('a\nb\nc', 'a\nB\nc\nd'))).toEqual({ added: 2, removed: 1 });
		expect(diffStat(lineDiff('a\nb', 'a\nb'))).toEqual({ added: 0, removed: 0 });
	});
});
