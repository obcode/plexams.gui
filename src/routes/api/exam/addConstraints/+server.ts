import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode, constraints } = await request.json();
	return gqlProxy(
		gql`
			mutation ($ancode: Int!, $constraints: ConstraintsInput!) {
				addConstraints(ancode: $ancode, constraints: $constraints) {
					ancode
				}
			}
		`,
		{ ancode, constraints }
	);
};
