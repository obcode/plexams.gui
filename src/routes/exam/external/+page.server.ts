import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// „Prüfungen anderer FKs": Termine für Prüfungen, die eine andere Fakultät plant.
// Zwei Quellen, nach FK zusammengeführt:
//   (a) ZPA-Prüfungen mit Constraint notPlannedByMe → FK = notPlannedByMeInFK
//       (Fallback: Fakultät des/der Prüfenden)
//   (b) MUC.DAI-Prüfungen anderer FKs → FK = plannedBy (≠ FK07)
// Beide werden über setExternalExamTime(ancode) terminiert; die Zeit steht immer in
// starttime, außerhalb des Zeitraums liegende Prüfungen haben keinen Slot (day/slot 0).

type PlanEntryTime = {
	starttime: string | null;
	external: boolean;
};

// Ergebnis-Shape der Query (nur die selektierten Felder — bewusst schlanker als
// die vollen Schema-Typen aus $lib/gql/types).
type QueryResult = {
	semesterConfig: { days: { date: string }[] } | null;
	mucdaiExams: {
		primussAncode: number;
		module: string;
		mainExamer: string;
		examType: string;
		duration: number;
		isRepeaterExam: boolean;
		program: string;
		plannedBy: string;
		ancode: number;
		planEntry: PlanEntryTime | null;
	}[];
	zpaExamsToPlanWithConstraints: {
		zpaExam: {
			ancode: number;
			module: string;
			mainExamer: string;
			mainExamerID: number;
			examType: string;
			examTypeFull: string;
			groups: string[];
		};
		constraints: { notPlannedByMe: boolean; notPlannedByMeInFK: string | null } | null;
		planEntry: PlanEntryTime | null;
	}[];
	teachers: { id: number; fk: string }[];
};

// Die vereinheitlichte Zeile, die die Seite (und $lib/exam/otherFkGroups) konsumiert.
export type OtherFkItem = {
	source: 'zpa' | 'mucdai';
	ancode: number;
	primussAncode?: number;
	module: string;
	mainExamer: string;
	examType: string;
	isRepeaterExam: boolean;
	fk: string;
	program: string | null;
	groups: string[];
	planEntry: PlanEntryTime | null;
};

export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest<QueryResult>(gql`
			query {
				semesterConfig {
					days {
						date
					}
				}
				mucdaiExams {
					primussAncode
					module
					mainExamer
					examType
					duration
					isRepeaterExam
					program
					plannedBy
					ancode
					planEntry {
						starttime
						external
					}
				}
				zpaExamsToPlanWithConstraints {
					zpaExam {
						ancode
						module
						mainExamer
						mainExamerID
						examType
						examTypeFull
						groups
					}
					constraints {
						notPlannedByMe
						notPlannedByMeInFK
					}
					planEntry {
						starttime
						external
					}
				}
				teachers {
					id
					fk
				}
			}
		`);

		// FK je Prüfenden-ID (Fallback für ZPA-Prüfungen ohne notPlannedByMeInFK)
		const fkById: Record<number, string> = {};
		for (const t of data.teachers ?? []) fkById[t.id] = t.fk;

		const items: OtherFkItem[] = [];

		// (a) ZPA notPlannedByMe
		for (const e of data.zpaExamsToPlanWithConstraints ?? []) {
			if (!e.constraints?.notPlannedByMe) continue;
			const fk = e.constraints?.notPlannedByMeInFK || fkById[e.zpaExam.mainExamerID] || '';
			items.push({
				source: 'zpa',
				ancode: e.zpaExam.ancode,
				module: e.zpaExam.module,
				mainExamer: e.zpaExam.mainExamer,
				examType: e.zpaExam.examTypeFull || e.zpaExam.examType,
				isRepeaterExam: false,
				fk,
				program: null,
				groups: e.zpaExam.groups ?? [],
				planEntry: e.planEntry
			});
		}

		// (b) MUC.DAI anderer FKs (FK07 = wir selbst)
		for (const e of data.mucdaiExams ?? []) {
			if (e.plannedBy === 'FK07') continue;
			items.push({
				source: 'mucdai',
				ancode: e.ancode,
				primussAncode: e.primussAncode,
				module: e.module,
				mainExamer: e.mainExamer,
				examType: e.examType,
				isRepeaterExam: !!e.isRepeaterExam,
				fk: e.plannedBy || '',
				program: e.program ?? null,
				groups: [],
				planEntry: e.planEntry
			});
		}

		return { items, days: data.semesterConfig?.days ?? [], loadError: '' };
	} catch (e) {
		return {
			items: [] as OtherFkItem[],
			days: [] as { date: string }[],
			loadError: gqlErrorMessage(e)
		};
	}
};
