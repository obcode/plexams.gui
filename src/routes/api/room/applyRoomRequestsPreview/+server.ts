import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { force } = await request.json();
	// u. a. „… already exist" wenn force=false und bereits Anfragen existieren (400)
	return gqlProxy(
		gql`
			mutation ($force: Boolean!) {
				applyRoomRequestsPreview(force: $force)
			}
		`,
		{ force: !!force }
	);
};
