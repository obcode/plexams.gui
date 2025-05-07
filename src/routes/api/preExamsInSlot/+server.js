import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
		query ($day: Int!, $time: Int!) {
			preExamsInSlot(day: $day, time: $time) {
				zpaExam {
					zpaID
					semester
					ancode
					module
					mainExamer
					mainExamerID
					examType
					examTypeFull
					duration
					isRepeaterExam
					groups
					primussAncodes {
						program
						ancode
					}
				}
				constraints {
					ancode
					notPlannedByMe
					online
					excludeDays
					possibleDays
					sameSlot
					roomConstraints {
						placesWithSocket
						lab
						exahm
						seb
						kdpJiraURL
						maxStudents
						comments
					}
				}
				planEntry {
					dayNumber
					slotNumber
					ancode
					locked
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
