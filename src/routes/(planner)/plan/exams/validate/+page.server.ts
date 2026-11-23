import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
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

	const data = await backendRequest(query);

	return { plannedExams: data.plannedExams };
};
