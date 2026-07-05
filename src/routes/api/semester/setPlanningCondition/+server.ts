import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { key, done } = await request.json();

	const mutation = gql`
		mutation ($key: String!, $done: Boolean!) {
			setPlanningCondition(key: $key, done: $done) {
				blockedAreas
				phases {
					key
					title
					conditions {
						key
						title
						done
						gate
					}
				}
			}
		}
	`;

	return gqlProxy(mutation, { key, done });
};
