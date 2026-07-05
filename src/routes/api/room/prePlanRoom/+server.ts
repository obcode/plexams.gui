import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode, roomName, reserve, mtknr, seats } = await request.json();
	return gqlProxy(
		gql`
			mutation (
				$ancode: Int!
				$roomName: String!
				$reserve: Boolean!
				$mtknr: String
				$seats: Int
			) {
				prePlanRoom(
					ancode: $ancode
					roomName: $roomName
					reserve: $reserve
					mtknr: $mtknr
					seats: $seats
				)
			}
		`,
		{ ancode, roomName, reserve, mtknr, seats }
	);
};
