import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			plannedExams {
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
					groups
					primussAncodes {
						program
						ancode
					}
				}
				mainExamer {
					fullname
					shortname
					isProf
					isLBA
					isProfHC
					isStaff
					lastSemester
					fk
					id
					email
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
						exams {
							semester
							ancode
							module
							mainExamer
						}
					}
				}
				constraints {
					ancode
					notPlannedByMe
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
					exams {
						semester
						ancode
						module
						mainExamer
					}
				}
				maxDuration
				planEntry {
					dayNumber
					slotNumber
					ancode
					locked
					starttime
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		plannedExams: data.plannedExams
	};
}
