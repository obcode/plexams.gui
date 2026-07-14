import { json } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = gql`
		query {
			allProgramsInPlan
		}
	`;

	const data = await backendRequest(query);

	return json(data.allProgramsInPlan);
};
