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
			}
		}
	`;

	let data = await request(env.PLEXAMS_SERVER, query);

	console.log('Rooms data:', data);

	return {
		rooms: data.rooms
	};
}
