import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/**
 * Neue (leere) Workspace-DB anlegen, basierend auf einem vorhandenen Semester.
 * database = Name der neuen DB, fromSemester = Quell-Semester (DB-Name).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { database, fromSemester } = await request.json();
	const mutation = gql`
		mutation ($database: String!, $fromSemester: String!) {
			createWorkspace(database: $database, fromSemester: $fromSemester) {
				id
				semester
			}
		}
	`;
	return gqlProxy(mutation, {
		database: String(database).trim(),
		fromSemester: String(fromSemester)
	});
}
