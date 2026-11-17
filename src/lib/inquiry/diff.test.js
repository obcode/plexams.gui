import { describe, expect, it } from 'vitest';
import { preplanDiff } from './diff';

describe('preplanDiff', () => {
	it('nennt nur geänderte Felder', () => {
		const a = {
			examKind: 'SEB',
			module: 'Web',
			programs: ['IF'],
			expectedStudents: 40,
			durationMin: null
		};
		const b = { ...a, programs: ['IF', 'IB'], expectedStudents: 55 };
		expect(preplanDiff(a, b)).toEqual([
			{ field: 'programs', label: 'Studiengänge', old: 'IF', new: 'IF, IB' },
			{ field: 'expectedStudents', label: 'Teilnehmende', old: '40', new: '55' }
		]);
	});
	it('ohne gesichtete Fassung kein Vergleich', () => {
		expect(preplanDiff(null, { module: 'x' })).toEqual([]);
	});
	it('leer und null sind gleich', () => {
		expect(preplanDiff({ remark: '' }, { remark: null })).toEqual([]);
	});
});
