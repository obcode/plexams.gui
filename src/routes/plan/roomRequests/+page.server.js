import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

// Gebäudemanagement-Raumanforderungen (nur diese; Anny/T-Räume haben eine
// eigene Quelle). Schlüssel je Anforderung: room + day + slot.
export async function load() {
	const query = gql`
		query {
			roomRequests {
				room
				day
				slot
				from
				until
				approved
				active
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		roomRequests: data.roomRequests ?? []
	};
}
