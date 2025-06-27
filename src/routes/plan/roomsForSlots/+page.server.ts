import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
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
			roomsForSlots {
				day
				slot
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
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		rooms: data.rooms
	};
}
