import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { starttime } = await request.json();
	return gqlProxy(
		gql`
			query ($starttime: Time!) {
				roomsAt(starttime: $starttime) {
					day
					slot
					starttime
					rooms {
						name
						exahm
					}
				}
			}
		`,
		{ starttime }
	);
};
