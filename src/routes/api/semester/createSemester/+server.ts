import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { semester, input } = await request.json();
	// ungültiger Name, Config existiert schon, Validierungsfehler → GraphQL-Error (400)
	return gqlProxy(
		gql`
			mutation ($semester: String!, $input: SemesterConfigInputData!) {
				createSemester(semester: $semester, input: $input) {
					ok
					warnings
				}
			}
		`,
		{ semester, input }
	);
};
