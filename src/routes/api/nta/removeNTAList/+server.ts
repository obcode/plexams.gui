import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
import type { RequestHandler } from './$types';

// Removes the uploaded NTA list of a faculty; the NTA master data stays as it is.
export const POST: RequestHandler = async ({ request }) => {
	const { fk } = await request.json();
	return gqlProxy(
		gql`
			mutation ($fk: String!) {
				removeNTAList(fk: $fk)
			}
		`,
		{ fk }
	);
};
