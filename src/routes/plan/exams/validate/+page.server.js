import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const query = gql`
		query {
			plannedExams {
				ancode
				zpaExam {
					module
					mainExamer
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return { plannedExams: data.plannedExams };
}
