import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { semester, database } = await request.json();
	const mutation = gql`
		mutation ($semester: String!, $database: String) {
			setSemester(semester: $semester, database: $database) {
				id
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			semester: String(semester),
			database: database ? String(database).trim() : null
		});
		return json(data);
	} catch (e) {
		// z. B. „läuft gerade eine Operation"
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
