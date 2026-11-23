import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const query = gql`
		query {
			examerInPlan {
				mainExamer
				mainExamerID
			}
		}
	`;

	const data = await backendRequest(query);

	return Response.json(data.examerInPlan);
};
