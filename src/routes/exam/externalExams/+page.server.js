import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			externalExams {
				ancode
				program
				module
				mainExamer
				duration
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		externalExams: data.externalExams
	};
}
