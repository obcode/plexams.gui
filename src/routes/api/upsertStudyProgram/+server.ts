import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();

	const mutation = gql`
		mutation ($input: StudyProgramInput!) {
			upsertStudyProgram(input: $input) {
				shortname
			}
		}
	`;

	return gqlProxy(mutation, { input });
};
