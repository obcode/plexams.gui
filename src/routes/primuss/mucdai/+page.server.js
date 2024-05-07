import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
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
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		mucdaiExams: data.mucdaiExams
	};
}
