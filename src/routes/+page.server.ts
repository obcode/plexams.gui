import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { TODO_FIELDS } from '$lib/server/todoFields';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			semester {
				id
			}
			planningState {
				blockedAreas
				phases {
					key
					title
					conditions {
						key
						title
						done
						gate
						auto
					}
				}
			}
		}
	`);

	// Eigener Request mit eigenem try/catch: ein Backend ohne Todos darf die
	// Planungs-Checkliste nicht mitreißen.
	let todos = [];
	try {
		const t = await backendRequest(gql`
			query {
				todos(filter: { done: false }) {
					${TODO_FIELDS}
				}
			}
		`);
		todos = t.todos;
	} catch {
		// älteres Backend ohne Todos
	}

	return {
		semester: data.semester.id,
		planningState: data.planningState,
		todos
	};
};
