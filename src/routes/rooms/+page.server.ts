import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

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
				sebSeats
				hmebSeats
			}
		}
	`;

	let data = await request(env.PLEXAMS_SERVER, query);

	return {
		rooms: data.rooms
	};
}
