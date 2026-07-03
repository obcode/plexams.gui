import { describe, it, expect } from 'vitest';
import { pairKey, isAutoConflict } from './conflictLoop';

describe('pairKey', () => {
	it('ist reihenfolge-unabhängig', () => {
		expect(pairKey(12, 34)).toBe('12-34');
		expect(pairKey(34, 12)).toBe('12-34');
	});
});

describe('isAutoConflict', () => {
	it('true nur wenn alle Betroffenen autoAccepted sind', () => {
		expect(
			isAutoConflict({ affectedStudents: [{ autoAccepted: true }, { autoAccepted: true }] })
		).toBe(true);
	});
	it('false, wenn mindestens eine:r nicht autoAccepted ist', () => {
		expect(
			isAutoConflict({ affectedStudents: [{ autoAccepted: true }, { autoAccepted: false }] })
		).toBe(false);
	});
	it('false bei leerer/fehlender Studierendenliste', () => {
		expect(isAutoConflict({ affectedStudents: [] })).toBe(false);
		expect(isAutoConflict({})).toBe(false);
	});
});
