import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

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
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			database: String(database).trim(),
			fromSemester: String(fromSemester)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
