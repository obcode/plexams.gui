import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';

export async function load() {
	const query = gql`
		query {
			rooms {
				name
				seats
				handicap
				lab
				placesWithSocket
				exahm
				seb
				needsRequest
				requestWith
				sebSeats
				hmebSeats
				deactivated
				hitzewert
			}
		}
	`;

	const data = await backendRequest(query);

	return {
		rooms: data.rooms
	};
}
