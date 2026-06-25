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
				mucDaiSlots {
					dayNumber
					slotNumber
				}
				starttimes {
					number
					start
				}
			}
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	return {
		semesterConfig: semesterData.semesterConfig
	};
}
