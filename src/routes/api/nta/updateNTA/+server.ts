import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();
	// u. a. wenn die mtknr nicht gefunden wird → 400
	return gqlProxy(
		gql`
			mutation ($input: NTAInput!) {
				updateNTA(input: $input) {
					mtknr
					name
				}
			}
		`,
		{ input }
	);
};
