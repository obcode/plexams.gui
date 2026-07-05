import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode, mtknr } = await request.json();
	return gqlProxy(
		gql`
			query ($ancode: Int!, $mtknr: String!) {
				plannedRoomForStudent(ancode: $ancode, mtknr: $mtknr) {
					room {
						name
					}
				}
			}
		`,
		{ ancode, mtknr }
	);
};
