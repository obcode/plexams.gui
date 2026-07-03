import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, active } = await request.json();

	const mutation = gql`
		mutation ($name: String!, $active: Boolean!) {
			setRoomActive(name: $name, active: $active) {
				name
				deactivated
			}
		}
	`;

	return gqlProxy(mutation, { name, active });
};
