import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!, $time: Int!) {
				roomsForSlot(day: $day, time: $time) {
					day
					slot
					rooms {
						name
						exahm
					}
				}
			}
		`,
		{ day, time }
	);
};
