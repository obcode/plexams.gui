import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { mtknr, ancode } = await request.json();

	const mutation = gql`
		mutation ($mtknr: String!, $ancode: Int!) {
			removeNtaRoomAloneWaiver(mtknr: $mtknr, ancode: $ancode)
		}
	`;

	return gqlProxy(mutation, { mtknr, ancode });
};
