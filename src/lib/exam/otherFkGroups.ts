// Gruppierung/Filterung der „Prüfungen anderer FKs" (Seite /exam/external):
// vereint MUC.DAI-Externe und ZPA-notPlannedByMe, nach FK gruppiert. Reine
// Funktionen, aus der .svelte extrahiert und unit-getestet.

export type OtherFkSource = 'mucdai' | 'zpa';

export const SOURCE_LABEL: Record<OtherFkSource, string> = {
	mucdai: 'MUC.DAI',
	zpa: 'ZPA'
};

/** Hat die Prüfung bereits eine Zeit? (steht jetzt immer in starttime) */
export function hasTime(e: { planEntry?: { starttime?: string | null } | null }): boolean {
	return !!e.planEntry?.starttime;
}

export type GroupFilter = {
	/** nur ohne gesetzte Zeit */
	onlyMissing?: boolean;
	/** Quelle; 'all' = beide */
	source?: OtherFkSource | 'all';
	/** FK-Filter; '' = alle */
	fk?: string;
};

export type FkGroup = { fk: string; exams: any[] };

/** Filtert und gruppiert die Items nach FK (alphabetisch; Prüfungen nach Ancode). */
export function buildGroups(items: any[] | null | undefined, f: GroupFilter = {}): FkGroup[] {
	const { onlyMissing, source = 'all', fk = '' } = f;
	const m = new Map<string, any[]>();
	for (const e of items ?? []) {
		if (onlyMissing && hasTime(e)) continue;
		if (source !== 'all' && e.source !== source) continue;
		const key = e.fk || '—';
		if (fk && key !== fk) continue;
		const row = {
			ancode: e.ancode,
			primussAncode: e.primussAncode,
			module: e.module,
			mainExamer: e.mainExamer,
			examType: e.examType,
			isRepeaterExam: e.isRepeaterExam,
			sourceLabel: SOURCE_LABEL[e.source as OtherFkSource] ?? '',
			// Programm (MUC.DAI) bzw. Gruppen (ZPA) als Kontext-Badges
			extra: e.program ? [e.program, ...(e.groups ?? [])] : (e.groups ?? []),
			fkLabel: '',
			planEntry: e.planEntry
		};
		if (!m.has(key)) m.set(key, []);
		m.get(key)?.push(row);
	}
	return [...m.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([fkKey, exams]) => ({
			fk: fkKey,
			exams: exams.sort((x, y) => (x.ancode ?? 0) - (y.ancode ?? 0))
		}));
}
