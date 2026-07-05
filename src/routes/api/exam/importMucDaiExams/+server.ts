import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { csv } = await request.json();
	const mutation = gql`
		mutation ($csv: String!) {
			importMucDaiExams(csv: $csv) {
				programs
				examsImported
				examsCreated
				examsExisting
				examsSkippedFK07
				examsRemoved
			}
		}
	`;
	return gqlProxy(mutation, { csv: String(csv ?? '') });
};
