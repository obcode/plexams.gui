import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

// Erwartete keys für den Abgleich:
//  - Deckblätter (cover-page): Prüfende mit von mir geplanten Prüfungen
//    (examersWithExamsPlannedByMe).
//  - Aufsichtskalender (invigilation-image): alle Aufsichten (invigilatorTodos).
export async function load() {
	const query = gql`
		query {
			examersWithExamsPlannedByMe {
				id
				shortname
			}
			invigilatorTodos {
				invigilators {
					teacher {
						id
						shortname
					}
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Prüfende mit von mir geplanten Prüfungen (eindeutig nach ID)
	const examerMap = new Map();
	(data.examersWithExamsPlannedByMe ?? []).forEach((/** @type {any} */ e) => {
		if (!examerMap.has(e.id)) {
			examerMap.set(e.id, { key: e.id, label: e.shortname });
		}
	});
	/** @type {{ key: string | number, label: string }[]} */
	const expectedExamers = Array.from(examerMap.values()).sort((a, b) =>
		a.label.localeCompare(b.label)
	);

	// alle Aufsichten
	/** @type {{ key: string | number, label: string }[]} */
	const expectedInvigilators = (data.invigilatorTodos?.invigilators ?? [])
		.map((/** @type {any} */ i) => ({
			key: i.teacher.id,
			label: i.teacher.shortname
		}))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.label.localeCompare(b.label));

	return { expectedExamers, expectedInvigilators };
}
