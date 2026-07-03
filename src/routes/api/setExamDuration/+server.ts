import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode, duration } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!, $duration: Int!) {
			setExamDuration(ancode: $ancode, duration: $duration) {
				ancode
				duration
			}
		}
	`;
	return gqlProxy(mutation, {
		ancode: Number(ancode),
		duration: Number(duration)
	});
};
