import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode } = await request.json();
	return gqlProxy(
		gql`
			mutation ($ancode: Int!) {
				addZpaExamToPlan(ancode: $ancode)
			}
		`,
		{ ancode }
	);
};
