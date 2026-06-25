import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { semester, input } = await request.json();

	const mutation = gql`
		mutation ($semester: String!, $input: SemesterConfigInputData!) {
			createSemester(semester: $semester, input: $input) {
				ok
				warnings
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { semester, input });
		return json(data);
	} catch (e) {
		// ungültiger Name, Config existiert schon, Validierungsfehler → GraphQL-Error
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
