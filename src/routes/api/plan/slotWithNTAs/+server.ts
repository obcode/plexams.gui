import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!, $time: Int!) {
				plannedExamsInSlot(day: $day, time: $time) {
					exam {
						ancode
						zpaExam {
							ancode
							module
							mainExamer
							examType
							groups
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
				}
			}
		`,
		{ day, time }
	);
};
