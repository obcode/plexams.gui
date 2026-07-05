import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();
	// u. a. wenn der Name schon existiert → 400
	return gqlProxy(
		gql`
			mutation ($input: RoomInput!) {
				addRoom(input: $input) {
					name
				}
			}
		`,
		{ input }
	);
};
