import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id, ancode } = await request.json();
	// unbekannter Ancode oder schon von anderer PreplanExam belegt → 400
	return gqlProxy(
		gql`
			mutation ($id: Int!, $ancode: Int!) {
				connectPreplanExamToAncode(id: $id, ancode: $ancode) {
					id
					ancode
				}
			}
		`,
		{ id, ancode }
	);
};
