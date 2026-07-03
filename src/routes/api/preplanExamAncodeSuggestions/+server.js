import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { id } = await request.json();

	const query = gql`
		query ($id: Int!) {
			preplanExamAncodeSuggestions(id: $id) {
				ancode
				module
				mainExamer
				mainExamerID
				examType
			}
		}
	`;

	return gqlProxy(query, { id });
}
