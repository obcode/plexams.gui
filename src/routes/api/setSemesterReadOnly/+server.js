import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
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
}
