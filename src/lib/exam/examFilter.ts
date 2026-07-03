// Filter der geplanten Prüfungen für die Ansichten in /plan/exams. Reine
// Funktion (aus der .svelte extrahiert), damit die Filter-Kombinatorik testbar
// ist. Bewusst tolerant getypt (die Prüfungs-Objekte sind die großen
// GraphQL-Shapes); relevant sind nur die hier gelesenen Felder.

export type PlannedFilter = {
	/** nur eigene (nicht „von anderer FK geplant") */
	onlyMine?: boolean;
	/** Studiengang; 'all' = alle */
	program?: string;
	/** Prüfenden-ID; 'all' = alle */
	examerID?: string | number;
	/** Ancode; '0' = alle */
	ancode?: string | number;
	/** nur Online-Prüfungen */
	onlyOnline?: boolean;
	/** nur EXaHM/SEB */
	onlyExahm?: boolean;
};

/** Filtert die Liste geplanter Prüfungen anhand der aktiven Toggles/Auswahlen. */
export function filterPlanned<T extends Record<string, any>>(
	list: T[] | null | undefined,
	f: PlannedFilter = {}
): T[] {
	const { onlyMine, program = 'all', examerID = 'all', ancode = '0', onlyOnline, onlyExahm } = f;
	return (list ?? []).filter((e) => {
		const c = e.constraints;
		if (onlyMine && c?.notPlannedByMe) return false;
		const progs = (e.primussExams ?? [])
			.filter((p: any) => (p.studentRegs?.length ?? 0) > 0)
			.map((p: any) => p.exam.program);
		let show = program === 'all' ? true : progs.includes(program);
		if (examerID !== 'all') show = show && e.zpaExam.mainExamerID == examerID;
		if (ancode !== '0') show = show && e.ancode == ancode;
		if (onlyOnline) show = !!c?.online;
		if (onlyExahm) show = !!(c?.roomConstraints?.exahm || c?.roomConstraints?.seb);
		return show;
	});
}
