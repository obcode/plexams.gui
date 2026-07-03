import { describe, it, expect } from 'vitest';
import { filterPlanned } from './examFilter';

/** @param over Teilobjekt, das die Defaults überschreibt */
const exam = (over: Record<string, any> = {}) => ({
	ancode: 100,
	zpaExam: { mainExamerID: 7 },
	constraints: {},
	primussExams: [{ exam: { program: 'IF' }, studentRegs: [{ mtknr: '1' }] }],
	...over
});

describe('filterPlanned', () => {
	it('ohne Filter alle', () => {
		const list = [exam(), exam({ ancode: 101 })];
		expect(filterPlanned(list)).toHaveLength(2);
		expect(filterPlanned(null)).toEqual([]);
	});

	it('onlyMine blendet notPlannedByMe aus', () => {
		const list = [exam(), exam({ ancode: 101, constraints: { notPlannedByMe: true } })];
		expect(filterPlanned(list, { onlyMine: true })).toHaveLength(1);
	});

	it('program filtert auf Studiengänge mit Anmeldungen', () => {
		const list = [
			exam({ primussExams: [{ exam: { program: 'IF' }, studentRegs: [{ mtknr: '1' }] }] }),
			exam({
				ancode: 101,
				primussExams: [{ exam: { program: 'BW' }, studentRegs: [{ mtknr: '2' }] }]
			})
		];
		expect(filterPlanned(list, { program: 'IF' })).toHaveLength(1);
	});

	it('ignoriert Studiengänge ohne Anmeldungen', () => {
		const list = [exam({ primussExams: [{ exam: { program: 'IF' }, studentRegs: [] }] })];
		expect(filterPlanned(list, { program: 'IF' })).toHaveLength(0);
	});

	it('filtert nach Prüfenden-ID und Ancode', () => {
		const list = [exam(), exam({ ancode: 101, zpaExam: { mainExamerID: 9 } })];
		expect(filterPlanned(list, { examerID: 9 })).toHaveLength(1);
		expect(filterPlanned(list, { ancode: 100 })).toHaveLength(1);
	});

	it('onlyOnline / onlyExahm anhand der Constraints', () => {
		const list = [
			exam({ constraints: { online: true } }),
			exam({ ancode: 101, constraints: { roomConstraints: { seb: true } } }),
			exam({ ancode: 102, constraints: {} })
		];
		expect(filterPlanned(list, { onlyOnline: true }).map((e) => e.ancode)).toEqual([100]);
		expect(filterPlanned(list, { onlyExahm: true }).map((e) => e.ancode)).toEqual([101]);
	});
});
