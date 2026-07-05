import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!, $time: Int!) {
				examsInSlot(day: $day, time: $time) {
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
						notPlannedByMeInFK
						excludeDays
						roomConstraints {
							placesWithSocket
							exahm
							seb
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
			}
		`,
		{ day, time }
	);
};
