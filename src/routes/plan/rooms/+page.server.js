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

	return {
		semesterConfig: semesterData.semesterConfig,
		plannedRoomNames: roomData.plannedRoomNames
	};
}
