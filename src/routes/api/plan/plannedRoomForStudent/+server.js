import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
		query ($ancode: Int!, $mtknr: String!) {
			plannedRoomForStudent(ancode: $ancode, mtknr: $mtknr) {
				room {
					name
				}
			}
		}
	`;

	const { ancode, mtknr } = await request.json();

	const variables = {
		ancode,
		mtknr
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, query, variables);

	return json(data);
}
