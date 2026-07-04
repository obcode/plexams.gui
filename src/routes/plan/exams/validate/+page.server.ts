import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
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

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	return { plannedExams: data.plannedExams };
};
