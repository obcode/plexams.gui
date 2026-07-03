import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request, gql } from 'graphql-request';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = gql`
		query {
			semester {
				id
			}
		}
	`;

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	return json(data.semester.id);
};
