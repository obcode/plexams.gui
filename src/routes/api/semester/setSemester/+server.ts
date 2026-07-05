import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// name = DB-Label (aus allSemesterNames), semester = optionaler logischer
	// Override (nur nötig, wenn die Ziel-DB noch kein Semester gespeichert hat).
	// z. B. „läuft gerade eine Operation" → GraphQL-Error (400)
	const { name, semester } = await request.json();
	return gqlProxy(
		gql`
			mutation ($name: String!, $semester: String) {
				setSemester(name: $name, semester: $semester) {
					id
					semester
				}
			}
		`,
		{ name: String(name), semester: semester ? String(semester).trim() : null }
	);
};
