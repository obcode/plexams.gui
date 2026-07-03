import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { shortname } = await request.json();

	const mutation = gql`
		mutation ($shortname: String!) {
			deleteStudyProgram(shortname: $shortname)
		}
	`;

	return gqlProxy(mutation, { shortname });
}
