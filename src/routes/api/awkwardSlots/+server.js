import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
		query ($ancode: Int!) {
			awkwardSlots(ancode: $ancode) {
				dayNumber
				slotNumber
			}
		}
	`;

	const { ancode } = await request.json();

	const variables = {
		ancode
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, query, variables);

	return json(data);
}
