import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();

	const mutation = gql`
		mutation ($input: InvigilatorConstraintsInput!) {
			setInvigilatorConstraints(input: $input) {
				teacherID
				isNotInvigilator
				excludedDates
				timeWindows {
					date
					from
					until
				}
			}
		}
	`;

	return gqlProxy(mutation, { input });
};
