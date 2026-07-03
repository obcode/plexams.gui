import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { teacherID, name, reason } = await request.json();

	const mutation = gql`
		mutation ($teacherID: Int!, $name: String!, $reason: String!) {
			setPermanentNonInvigilator(teacherID: $teacherID, name: $name, reason: $reason) {
				teacherID
				name
				reason
			}
		}
	`;

	return gqlProxy(mutation, { teacherID, name, reason });
}
