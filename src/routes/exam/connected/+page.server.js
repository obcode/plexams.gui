import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			connectedExams {
				zpaExam {
					ancode
					module
					mainExamer
					examType
					groups
				}
				primussExams {
					ancode
					module
					mainExamer
					program
					examType
				}
				errors
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		connectedExams: data.connectedExams
	};
}
