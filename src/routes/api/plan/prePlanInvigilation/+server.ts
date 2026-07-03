import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { invigilatorID, day, slot, roomName } = await request.json();

	const mutation = gql`
		mutation ($invigilatorID: Int!, $day: Int!, $slot: Int!, $roomName: String) {
			prePlanInvigilation(
				invigilatorID: $invigilatorID
				day: $day
				slot: $slot
				roomName: $roomName
			)
		}
	`;

	return gqlProxy(mutation, {
		invigilatorID,
		day,
		slot,
		roomName
	});
};
