import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { readOnly } = await request.json();
	const mutation = gql`
		mutation ($readOnly: Boolean!) {
			setSemesterReadOnly(readOnly: $readOnly) {
				id
				readOnly
			}
		}
	`;
	return gqlProxy(mutation, { readOnly: !!readOnly });
};
