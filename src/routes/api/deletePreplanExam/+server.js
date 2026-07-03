import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { id } = await request.json();

	const mutation = gql`
		mutation ($id: Int!) {
			deletePreplanExam(id: $id)
		}
	`;

	return gqlProxy(mutation, { id });
}
