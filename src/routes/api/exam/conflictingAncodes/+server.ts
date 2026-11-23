import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode } = await request.json();
	return gqlProxy(
		gql`
			query ($ancode: Int!) {
				conflictingAncodes(ancode: $ancode) {
					ancode
					numberOfStuds
				}
			}
		`,
		{ ancode }
	);
};
