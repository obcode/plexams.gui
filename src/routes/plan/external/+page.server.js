import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

// „Prüfungen anderer FKs": Termine für Prüfungen, die eine andere Fakultät plant.
// Zwei Quellen, nach FK zusammengeführt:
//   (a) ZPA-Prüfungen mit Constraint notPlannedByMe → FK = notPlannedByMeInFK
//       (Fallback: Fakultät des/der Prüfenden)
//   (b) MUC.DAI-Prüfungen anderer FKs → FK = plannedBy (≠ FK07)
// Beide werden über setExternalExamTime(ancode) terminiert; außerhalb des
// Zeitraums liegende Prüfungen behalten nur eine Zeit (externalTime), keinen Slot.
export async function load() {
	try {
		const data = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
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
							externalTime
							dayNumber
							slotNumber
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
							externalTime
							dayNumber
							slotNumber
						}
					}
					teachers {
						id
						fk
					}
				}
			`
		);

		// FK je Prüfenden-ID (Fallback für ZPA-Prüfungen ohne notPlannedByMeInFK)
		/** @type {Record<number, string>} */
		const fkById = {};
		for (const t of data.teachers ?? []) fkById[t.id] = t.fk;

		/** @type {any[]} */
		const items = [];

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

		return { items, loadError: '' };
	} catch (e) {
		return { items: [], loadError: gqlErrorMessage(e) };
	}
}
