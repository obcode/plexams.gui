import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

// Termine für extern geplante Prüfungen: von anderen FKs geplante MUC.DAI-
// Prüfungen sowie ZPA-Prüfungen mit dem Constraint notPlannedByMe. Beide werden
// über setExternalExamTime(ancode) terminiert.
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

		// FK je Prüfenden-ID (für den FK-Badge der ZPA-Prüfungen)
		/** @type {Record<number, string>} */
		const fkById = {};
		for (const t of data.teachers ?? []) fkById[t.id] = t.fk;

		// MUC.DAI: nur von anderen FKs geplante (externe) Prüfungen
		const mucdai = (data.mucdaiExams ?? []).filter(
			(/** @type {any} */ e) => e.plannedBy !== 'FK07'
		);

		// ZPA-Prüfungen mit notPlannedByMe (werden von anderen geplant)
		const zpa = (data.zpaExamsToPlanWithConstraints ?? [])
			.filter((/** @type {any} */ e) => e.constraints?.notPlannedByMe)
			.map((/** @type {any} */ e) => ({
				ancode: e.zpaExam.ancode,
				module: e.zpaExam.module,
				mainExamer: e.zpaExam.mainExamer,
				examType: e.zpaExam.examTypeFull || e.zpaExam.examType,
				groups: e.zpaExam.groups ?? [],
				fk: fkById[e.zpaExam.mainExamerID] ?? '',
				planEntry: e.planEntry
			}));

		return { mucdai, zpa, loadError: '' };
	} catch (e) {
		return { mucdai: [], zpa: [], loadError: gqlErrorMessage(e) };
	}
}
