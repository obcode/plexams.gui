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
				}
				constraints {
					ancode
					notPlannedByMe
					online
					excludeDays
					possibleDays
					sameSlot
					roomConstraints {
						placesWithSocket
						lab
						exahmRooms
						seb
					}
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		zpaExamsToPlanWithConstraints: data.zpaExamsToPlanWithConstraints
	};
}
