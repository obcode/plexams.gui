import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { conditionsDoneMap } from '$lib/email/emailConditions';
import type { PageServerLoad } from './$types';

// Erwartete keys für den Abgleich:
//  - Deckblätter (cover-page): Prüfende mit von mir geplanten Prüfungen
//    (examersWithExamsPlannedByMe).
//  - Aufsichtskalender (invigilation-image): alle Aufsichten (invigilatorTodos).
export const load: PageServerLoad = async () => {
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
			planningState {
				phases {
					conditions {
						key
						done
					}
				}
			}
		}
	`;

	const data = await backendRequest(query);

	// Prüfende mit von mir geplanten Prüfungen (eindeutig nach ID)
	const examerMap = new Map<string | number, { key: string | number; label: string }>();
	(data.examersWithExamsPlannedByMe ?? []).forEach((e: any) => {
		if (!examerMap.has(e.id)) {
			examerMap.set(e.id, { key: e.id, label: e.shortname });
		}
	});
	const expectedExamers = Array.from(examerMap.values()).sort((a, b) =>
		a.label.localeCompare(b.label)
	);

	// alle Aufsichten
	const expectedInvigilators: { key: string | number; label: string }[] = (
		data.invigilatorTodos?.invigilators ?? []
	)
		.map((i: any) => ({
			key: i.teacher.id,
			label: i.teacher.shortname
		}))
		.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

	return {
		expectedExamers,
		expectedInvigilators,
		conditionsDone: conditionsDoneMap(data.planningState)
	};
};
