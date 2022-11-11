import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			connectedExams {
				zpaExam {
					anCode
					module
					mainExamer
					examType
					groups
				}
				primussExams {
					anCode
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
