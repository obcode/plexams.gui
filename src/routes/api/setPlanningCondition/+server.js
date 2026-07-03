import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
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
}
