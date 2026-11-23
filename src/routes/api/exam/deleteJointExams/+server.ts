import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// program: a joint study program, or empty/null for all of them.
export const POST: RequestHandler = async ({ request }) => {
	const { program } = await request.json().catch(() => ({}));
	const mutation = gql`
		mutation ($program: String) {
			deleteJointExams(program: $program) {
				programs
				examsDeleted
				externalExamsDeleted
			}
		}
	`;
	return gqlProxy(mutation, { program: program ? String(program) : null });
};
