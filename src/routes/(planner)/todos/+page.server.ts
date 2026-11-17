import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { TODO_FIELDS } from '$lib/server/todoFields';
import { previousSemester } from '$lib/todo/todo.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest<{
		semester: { id: string };
		todos: any[];
		todoLabels: string[];
	}>(
		gql`
			query {
				semester {
					id
				}
				todos {
					${TODO_FIELDS}
				}
				todoLabels
			}
		`
	);

	// Übernahme aus dem Vorsemester anbieten, solange dort noch etwas offen ist.
	const fromSemester = previousSemester(data.semester.id);
	let carryOverCandidates = 0;
	if (fromSemester) {
		try {
			const c = await backendRequest<{ todoCarryOverCandidates: number }>(
				gql`
					query ($from: String!) {
						todoCarryOverCandidates(fromSemester: $from)
					}
				`,
				{ from: fromSemester }
			);
			carryOverCandidates = c.todoCarryOverCandidates;
		} catch {
			// Kein Vorsemester in der Datenbank o. Ä. — dann eben kein Angebot.
		}
	}

	return {
		semester: data.semester.id,
		todos: data.todos,
		labels: data.todoLabels,
		fromSemester,
		carryOverCandidates
	};
};
