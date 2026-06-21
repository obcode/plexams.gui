import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

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

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { key, done });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
