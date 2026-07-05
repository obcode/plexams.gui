import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { mtknr, active } = await request.json();

	const mutation = gql`
		mutation ($mtknr: String!, $active: Boolean!) {
			setNTAActive(mtknr: $mtknr, active: $active) {
				mtknr
				deactivated
			}
		}
	`;

	return gqlProxy(mutation, { mtknr, active });
};
