import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!, $time: Int!) {
				examsInSlot(day: $day, time: $time) {
					ancode
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
						faculty
						groups
						primussAncodes {
							program
							ancode
						}
					}
					primussExams {
						exam {
							ancode
							module
							mainExamer
							program
							examType
							presence
						}
						studentRegs {
							mtknr
							ancode
							program
							group
							name
							presence
						}
						conflicts {
							ancode
							numberOfStuds
						}
						ntas {
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
					}
					constraints {
						ancode
						notPlannedByMe
						notPlannedByMeInFK
						excludeDays
						possibleDays
						fixedDay
						fixedTime
						sameSlot
						online
						roomConstraints {
							placesWithSocket
							lab
							exahm
							seb
						}
					}
					conflicts {
						ancode
						numberOfStuds
						primussAncodes {
							ancode
							program
							numberOfStuds
						}
					}
					studentRegsCount
					ntas {
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
					maxDuration
					planEntry {
						dayNumber
						slotNumber
						ancode
						locked
						phaseFixed
						externalTime
					}
					plannedRooms {
						room {
							name
							seats
							handicap
							lab
							placesWithSocket
							needsRequest
							requestWith
							exahm
							seb
						}
						duration
						handicap
						handicapRoomAlone
						reserve
						studentsInRoom
						ntaMtknr
						prePlanned
					}
				}
			}
		`,
		{ day, time }
	);
};
