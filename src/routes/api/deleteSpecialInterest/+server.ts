import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();
	const mutation = gql`
		mutation ($name: String!) {
			deleteSpecialInterest(name: $name)
		}
	`;
	return gqlProxy(mutation, { name });
};
