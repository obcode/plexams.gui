import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				mucdaiExams {
					primussAncode
					module
					mainExamer
					mainExamerID
					examType
					duration
					isRepeaterExam
					program
					plannedBy
					ancode
					planEntry {
						dayNumber
						slotNumber
						starttime
						externalTime
					}
				}
			}
		`
	);
	return { mucdaiExams: data.mucdaiExams ?? [] };
}
