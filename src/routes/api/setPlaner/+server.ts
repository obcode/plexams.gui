import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, email } = await request.json();

	const mutation = gql`
		mutation ($name: String!, $email: String!) {
			setPlaner(name: $name, email: $email) {
				name
				email
			}
		}
	`;

	return gqlProxy(mutation, { name, email });
};
