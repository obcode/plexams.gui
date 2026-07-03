import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
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
};
