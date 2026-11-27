import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
import type { RequestHandler } from './$types';

// Writes the selected rows of the uploaded NTA lists to the NTA master data
// (all or nothing).
export const POST: RequestHandler = async ({ request }) => {
	const { items } = await request.json();
	return gqlProxy(
		gql`
			mutation ($items: [NTAListApplyItem!]!) {
				applyNTAList(items: $items) {
					added
					updated
				}
			}
		`,
		{ items }
	);
};
