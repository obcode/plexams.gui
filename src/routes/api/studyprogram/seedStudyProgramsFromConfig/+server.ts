import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const mutation = gql`
		mutation {
			seedStudyProgramsFromConfig
		}
	`;

	return gqlProxy(mutation);
};
