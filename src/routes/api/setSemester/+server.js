import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	// name = DB-Label (aus allSemesterNames), semester = optionaler logischer
	// Override (nur nötig, wenn die Ziel-DB noch kein Semester gespeichert hat).
	const { name, semester } = await request.json();
	const mutation = gql`
		mutation ($name: String!, $semester: String) {
			setSemester(name: $name, semester: $semester) {
				id
				semester
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			name: String(name),
			semester: semester ? String(semester).trim() : null
		});
		return json(data);
	} catch (e) {
		// z. B. „läuft gerade eine Operation"
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
