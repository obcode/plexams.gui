import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

export const POST = async ({ request }) => {
	const { email, teacherID } = await request.json();
	return gqlProxy(
		gql`
			mutation ($email: String!, $teacherID: Int!) {
				removeLoginAlias(email: $email, teacherID: $teacherID)
			}
		`,
		{ email: String(email ?? ''), teacherID: Number(teacherID) }
	);
};
