import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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
};
