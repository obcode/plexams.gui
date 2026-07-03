import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name, email } = await request.json();

	const mutation = gql`
		mutation ($name: String!, $email: String!) {
			setPlaner(name: $name, email: $email) {
				name
				email
			}
		}
	`;

	return gqlProxy(mutation, { name, email });
}
