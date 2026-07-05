import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { shortname } = await request.json();

	const mutation = gql`
		mutation ($shortname: String!) {
			deleteStudyProgram(shortname: $shortname)
		}
	`;

	return gqlProxy(mutation, { shortname });
};
