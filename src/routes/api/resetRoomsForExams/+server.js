import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const mutation = gql`
		mutation {
			resetRoomsForExams
		}
	`;

	return gqlProxy(mutation);
}
