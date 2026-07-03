import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { id, input } = await request.json();

	const mutation = gql`
		mutation ($id: Int!, $input: PreplanExamInput!) {
			updatePreplanExam(id: $id, input: $input) {
				id
			}
		}
	`;

	return gqlProxy(mutation, { id, input });
}
