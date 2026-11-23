import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const mutation = gql`
		mutation ResetPreplanTimes {
			resetPreplanTimes
		}
	`;

	return gqlProxy(mutation);
};
