import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { mtknr, active } = await request.json();

	const mutation = gql`
		mutation ($mtknr: String!, $active: Boolean!) {
			setNTAActive(mtknr: $mtknr, active: $active) {
				mtknr
				deactivated
			}
		}
	`;

	return gqlProxy(mutation, { mtknr, active });
}
