import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { invigilatorID, starttime, roomName } = await request.json();

	const mutation = gql`
		mutation ($invigilatorID: Int!, $starttime: Time!, $roomName: String) {
			prePlanInvigilation(invigilatorID: $invigilatorID, starttime: $starttime, roomName: $roomName)
		}
	`;

	return gqlProxy(mutation, { invigilatorID, starttime, roomName });
};
