import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { id } = await request.json();

	const mutation = gql`
		mutation ($id: Int!) {
			disconnectPreplanExam(id: $id) {
				id
				ancode
			}
		}
	`;

	return gqlProxy(mutation, { id });
}
