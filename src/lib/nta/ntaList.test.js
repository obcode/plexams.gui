import { describe, expect, it } from 'vitest';
import {
	applyItem,
	countByStatus,
	formatDate,
	selectedByDefault,
	sortRows,
	uploadSummaryText
} from './ntaList.js';

const proposal = {
	name: 'Muster, Erika',
	email: null,
	mtknr: '00000001',
	compensation: '10% Schreibzeitverlängerung',
	deltaDurationPercent: 10,
	needsRoomAlone: false,
	needsHardware: false,
	program: 'IF',
	from: '27.11.2026',
	until: 'Studium IF'
};

describe('ntaList', () => {
	it('selects new and changed rows', () => {
		expect(selectedByDefault({ status: 'NEW' })).toBe(true);
		expect(selectedByDefault({ status: 'CHANGED' })).toBe(true);
		expect(selectedByDefault({ status: 'UNCHANGED' })).toBe(false);
		expect(selectedByDefault({ status: 'PROBLEM' })).toBe(false);
	});

	it('builds ADD for new and UPDATE for existing NTAs, preferring the correction', () => {
		expect(applyItem({ proposal, existing: null }).action).toBe('ADD');
		const item = applyItem(
			{ proposal, existing: proposal },
			{ ...proposal, deltaDurationPercent: '25' }
		);
		expect(item.action).toBe('UPDATE');
		expect(item.nta.deltaDurationPercent).toBe(25);
		expect(Object.keys(item.nta)).toHaveLength(10);
	});

	it('sorts by status, then name', () => {
		const rows = sortRows([
			{ status: 'UNCHANGED', name: 'A' },
			{ status: 'NEW', name: 'B' },
			{ status: 'NEW', name: 'Ä' },
			{ status: 'CHANGED', name: 'C' }
		]);
		expect(rows.map((r) => r.name)).toEqual(['Ä', 'B', 'C', 'A']);
		expect(countByStatus(rows)).toEqual({ NEW: 2, CHANGED: 1, PROBLEM: 0, UNCHANGED: 1 });
	});

	it('formats dates in Berlin time', () => {
		expect(formatDate('2026-11-27T10:05:29+01:00')).toBe('27.11.2026');
		expect(formatDate('2026-11-27T10:05:29+01:00', true)).toBe('27.11.2026, 10:05');
		expect(formatDate(null)).toBe('');
	});

	it('summarizes an upload', () => {
		expect(uploadSummaryText({ fk: '07', firstUpload: true, rows: 13 })).toContain('13 Einträge');
		expect(
			uploadSummaryText({
				fk: '07',
				rows: 13,
				newRows: 0,
				changedRows: 0,
				removedRows: 0,
				unchangedRows: 13,
				previousStand: '2026-11-27T10:05:29+01:00'
			})
		).toBe('FK 07: Die Liste hat sich seit dem Stand vom 27.11.2026 nicht geändert (13 Einträge).');
		expect(
			uploadSummaryText({
				fk: '21',
				rows: 7,
				newRows: 1,
				changedRows: 1,
				removedRows: 1,
				unchangedRows: 5
			})
		).toBe('FK 21: 1 neu, 1 geändert, 1 nicht mehr enthalten; 5 unverändert.');
	});
});
