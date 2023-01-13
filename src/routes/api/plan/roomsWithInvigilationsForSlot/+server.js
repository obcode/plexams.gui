import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
		query ($day: Int!, $time: Int!) {
			roomsWithInvigilationsForSlot(day: $day, time: $time) {
				reserve {
					shortname
				}
				roomsWithInvigilators {
					name
					maxDuration
					studentCount
					roomAndExams {
						room {
							room {
								name
							}
							duration
							seatsPlanned
						}
						exam {
							ancode
							module
							mainExamer
						}
					}
					invigilator {
						shortname
					}
				}
			}
		}
	`;

	const { day, time } = await request.json();

	const variables = {
		day,
		time
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, query, variables);

	return json(data);
}
