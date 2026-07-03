import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { mtknr, ancode, reason } = await request.json();

	const mutation = gql`
		mutation ($mtknr: String!, $ancode: Int!, $reason: String!) {
			addNtaRoomAloneWaiver(mtknr: $mtknr, ancode: $ancode, reason: $reason) {
				mtknr
				ancode
				reason
			}
		}
	`;

	return gqlProxy(mutation, { mtknr, ancode, reason });
}
