import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { keepAssigned } = await request.json();

	const mutation = gql`
		mutation ($keepAssigned: Boolean!) {
			generatePreplanAssignment(keepAssigned: $keepAssigned) {
				ok
				assignedCount
				unassignedIDs
				messages
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			keepAssigned: Boolean(keepAssigned)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
