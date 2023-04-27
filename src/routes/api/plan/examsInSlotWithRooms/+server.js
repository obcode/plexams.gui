import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
		query ($day: Int!, $time: Int!) {
			examsInSlotWithRooms(day: $day, time: $time) {
				exam {
					exam {
						ancode
						zpaExam {
							ancode
							module
							mainExamer
							examType
							groups
							duration
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
						roomConstraints {
							placesWithSocket
							exahmRooms
							lab
						}
					}
					nta {
						nta {
							name
							mtknr
							compensation
							deltaDurationPercent
							needsRoomAlone
							program
							from
							until
							lastSemester
						}
						regs {
							student {
								name
								mtknr
							}
							ancodes
						}
					}
					slot {
						dayNumber
						slotNumber
						starttime
					}
				}
				rooms {
					room {
						name
						seats
						exahm
						lab
						handicap
					}
					seatsPlanned
					handicap
					students {
						name
					}
					duration
					reserve
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
