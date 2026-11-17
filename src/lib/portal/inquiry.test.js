import { describe, expect, it } from 'vitest';
import { inquiryPath, preplanInputFromForm } from './inquiry';

describe('inquiryPath', () => {
	it('kennt nur die Arten mit eigener Seite', () => {
		expect(inquiryPath({ semester: '2027-SS', kind: 'PREPLAN' })).toBe('/portal/2027-SS/exahm-seb');
		expect(inquiryPath({ semester: '2027-SS', kind: 'INVIGILATION' })).toBeNull();
	});
});

describe('preplanInputFromForm', () => {
	it('formt das Formular', () => {
		const f = new FormData();
		f.set('examKind', 'SEB');
		f.set('module', '  Web ');
		f.append('programs', 'IF');
		f.append('programs', 'IB');
		f.set('expectedStudents', '40');
		f.set('durationMin', '');
		expect(preplanInputFromForm(f)).toEqual({
			examKind: 'SEB',
			module: 'Web',
			programs: ['IF', 'IB'],
			expectedStudents: 40,
			durationMin: null,
			remark: ''
		});
	});
	it('fällt bei Unsinn auf EXaHM und 0 zurück – das Backend lehnt dann ab', () => {
		const f = new FormData();
		f.set('examKind', 'x');
		f.set('expectedStudents', 'viele');
		f.set('durationMin', '90');
		const input = preplanInputFromForm(f);
		expect(input.examKind).toBe('EXaHM');
		expect(input.expectedStudents).toBe(0);
		expect(input.durationMin).toBe(90);
	});
});
