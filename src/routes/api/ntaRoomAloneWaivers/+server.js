import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const query = gql`
		query {
			ntaRoomAloneWaivers {
				mtknr
				ancode
				reason
			}
		}
	`;

	return gqlProxy(query);
}
