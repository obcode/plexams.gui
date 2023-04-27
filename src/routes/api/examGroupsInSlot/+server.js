import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
		query ($day: Int!, $time: Int!) {
			examGroupsInSlot(day: $day, time: $time) {
				examGroupCode
				exams {
					exam {
						ancode
						zpaExam {
							ancode
							module
							mainExamer
							mainExamerID
							examType
							groups
							isRepeaterExam
						}
						primussExams {
							ancode
							module
							mainExamer
							program
							examType
						}
						studentRegs {
							program
							studentRegs {
								mtknr
								ancode
								program
								presence
								group
								name
							}
						}
						conflicts {
							program
							conflicts {
								ancode
								numberOfStuds
							}
						}
						connectErrors
					}
					constraints {
						ancode
						notPlannedByMe
						excludeDays
						online
						roomConstraints {
							placesWithSocket
							lab
							exahmRooms
						}
					}
				}
				examGroupInfo {
					notPlannedByMe
					excludeDays
					possibleDays
					fixedDay
					fixedSlot {
						dayNumber
						slotNumber
						starttime
					}
					possibleSlots {
						dayNumber
						slotNumber
						starttime
					}
					conflicts {
						examGroupCode
						count
					}
					studentRegs
					programs
					maxDuration
					maxDurationNTA
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
