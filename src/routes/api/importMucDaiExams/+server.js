import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
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
}
