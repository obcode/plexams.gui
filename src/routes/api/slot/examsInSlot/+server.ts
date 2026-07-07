import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { NTA_FIELDS } from '$lib/gql/fragments';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { starttime } = await request.json();
	return gqlProxy(
		gql`
			query ($starttime: Time!) {
				examsAt(starttime: $starttime) {
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
						starttime
						external
						ancode
						locked
						phaseFixed
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
		{ starttime }
	);
};
