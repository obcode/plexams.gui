import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { teacherID } = await request.json();

	const mutation = gql`
		mutation ($teacherID: Int!) {
			deleteInvigilatorConstraints(teacherID: $teacherID)
		}
	`;

	return gqlProxy(mutation, { teacherID });
};
