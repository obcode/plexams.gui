import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// starttime gesetzt = zuordnen; null = Zuordnung löschen.
	// ungültiger Slot des Semesters → GraphQL-Error (400)
	const { id, starttime } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!, $starttime: Time) {
				setPreplanExamTime(id: $id, starttime: $starttime) {
					id
					plannedStarttime
				}
			}
		`,
		{ id, starttime: starttime ?? null }
	);
};
