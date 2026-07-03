import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name } = await request.json();
	const mutation = gql`
		mutation ($name: String!) {
			deleteSpecialInterest(name: $name)
		}
	`;
	return gqlProxy(mutation, { name });
}
