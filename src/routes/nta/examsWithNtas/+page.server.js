import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			examsWithNtas {
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
		examsWithNtas: data.examsWithNtas
	};
}
