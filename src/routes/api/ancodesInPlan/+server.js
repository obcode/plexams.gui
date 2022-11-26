import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const query = gql`
		query {
			ancodesInPlan
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return json(data.ancodesInPlan);
}
