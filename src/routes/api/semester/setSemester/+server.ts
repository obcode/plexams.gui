import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// name = Semester (aus allSemesterNames), z. B. „2026-SS".
	// z. B. „läuft gerade eine Operation" → GraphQL-Error (400)
	const { name } = await request.json();
	return gqlProxy(
		gql`
			mutation ($name: String!) {
				setSemester(name: $name) {
					id
				}
			}
		`,
		{ name: String(name) }
	);
};
