import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			zpaExamsToPlanWithConstraints {
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
						allowedRooms
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

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		zpaExamsToPlanWithConstraints: data.zpaExamsToPlanWithConstraints
	};
}
