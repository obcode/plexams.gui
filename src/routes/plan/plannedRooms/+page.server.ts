import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const semesterQuery = gql`
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
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	const roomQuery = gql`
		query {
			plannedRoomNames
		}
	`;

	const roomData = await request(env.PLEXAMS_SERVER, roomQuery);

	const plannedRoomsQuery = gql`
		query {
			plannedRooms {
				day
				slot
				room {
					name
				}
			}
		}
	`;

	const plannedRoomsData = await request(env.PLEXAMS_SERVER, plannedRoomsQuery);

	const plannedRoomsSet = new Set(
		plannedRoomsData.plannedRooms.map((room: any) => `${room.day}-${room.slot}-${room.room.name}`)
	);

	return {
		semesterConfig: semesterData.semesterConfig,
		plannedRoomNames: roomData.plannedRoomNames,
		plannedRooms: plannedRoomsSet
	};
}
