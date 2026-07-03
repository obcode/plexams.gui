import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { teacherID } = await request.json();

	const mutation = gql`
		mutation ($teacherID: Int!) {
			removePermanentNonInvigilator(teacherID: $teacherID)
		}
	`;

	return gqlProxy(mutation, { teacherID });
}
