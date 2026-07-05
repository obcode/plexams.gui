import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();
	// u. a. wenn die mtknr schon existiert → 400
	return gqlProxy(
		gql`
			mutation ($input: NTAInput!) {
				addNTA(input: $input) {
					mtknr
					name
				}
			}
		`,
		{ input }
	);
};
