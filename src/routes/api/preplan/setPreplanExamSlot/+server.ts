import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// dayNumber/slotNumber beide gesetzt = zuordnen; beide null = Zuordnung löschen.
	// ungültiger Slot des Semesters → GraphQL-Error (400)
	const { id, dayNumber, slotNumber } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!, $dayNumber: Int, $slotNumber: Int) {
				setPreplanExamSlot(id: $id, dayNumber: $dayNumber, slotNumber: $slotNumber) {
					id
					plannedDayNumber
					plannedSlotNumber
				}
			}
		`,
		{ id, dayNumber: dayNumber ?? null, slotNumber: slotNumber ?? null }
	);
};
