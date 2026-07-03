import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { mtknr, ancode } = await request.json();

	const mutation = gql`
		mutation ($mtknr: String!, $ancode: Int!) {
			removeNtaRoomAloneWaiver(mtknr: $mtknr, ancode: $ancode)
		}
	`;

	return gqlProxy(mutation, { mtknr, ancode });
}
