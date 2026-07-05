import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { NTA_FIELDS } from '$lib/gql/fragments';
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
							${NTA_FIELDS}
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
						${NTA_FIELDS}
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
