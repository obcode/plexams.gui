import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			zpaExamsByType {
				type
				exams {
					zpaID
					semester
					anCode
					module
					mainExamer
					mainExamerID
					examType
					examTypeFull
					duration
					isRepeaterExam
					groups
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		zpaExamsByType: data.zpaExamsByType
	};
}
