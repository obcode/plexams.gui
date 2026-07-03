import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// dayNumber/slotNumber beide gesetzt = zuordnen; beide null = Zuordnung löschen
	const { id, dayNumber, slotNumber } = await request.json();

	const mutation = gql`
		mutation ($id: Int!, $dayNumber: Int, $slotNumber: Int) {
			setPreplanExamSlot(id: $id, dayNumber: $dayNumber, slotNumber: $slotNumber) {
				id
				plannedDayNumber
				plannedSlotNumber
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			id,
			dayNumber: dayNumber ?? null,
			slotNumber: slotNumber ?? null
		});
		return json(data);
	} catch (e) {
		// ungültiger Slot des Semesters → GraphQL-Error
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
