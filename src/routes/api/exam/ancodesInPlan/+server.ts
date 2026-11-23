import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const query = gql`
		query {
			ancodesInPlan
		}
	`;

	const data = await backendRequest(query);

	return Response.json(data.ancodesInPlan);
};
