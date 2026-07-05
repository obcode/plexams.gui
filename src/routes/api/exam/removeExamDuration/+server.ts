import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!) {
			removeExamDuration(ancode: $ancode)
		}
	`;
	return gqlProxy(mutation, { ancode: Number(ancode) });
};
