import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { fromSemester } = await request.json();
	return gqlProxy(
		gql`
			mutation ($fromSemester: String!) {
				carryOverTodos(fromSemester: $fromSemester)
			}
		`,
		{ fromSemester }
	);
};
