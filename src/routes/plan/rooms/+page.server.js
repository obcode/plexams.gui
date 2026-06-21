import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const query = gql`
		query {
			semesterConfig {
				days {
					number
					date
				}
				starttimes {
					number
					start
				}
			}
			plannedRoomNames
			plannedRooms {
				day
				slot
				room {
					name
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Set für die „nach Räumen"-Übersicht: welcher Raum ist in welchem day-slot
	// geplant. (devalue serialisiert Sets über die SvelteKit-Grenze.)
	const plannedRooms = new Set(
		(data.plannedRooms ?? []).map((/** @type {any} */ r) => `${r.day}-${r.slot}-${r.room.name}`)
	);

	return {
		semesterConfig: data.semesterConfig,
		plannedRoomNames: data.plannedRoomNames,
		plannedRooms
	};
}
