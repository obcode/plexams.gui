import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			ntas {
				name
				mtknr
				compensation
				deltaDurationPercent
				needsRoomAlone
				program
				from
				until
				lastSemester
				exams {
					anCode
					module
				}
			}
		}
	`;

	let data = await request(env.PLEXAMS_SERVER, query);

	return {
		ntas: data.ntas
	};
}
