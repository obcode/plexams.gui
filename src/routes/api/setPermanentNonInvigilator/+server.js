import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { teacherID, name, reason } = await request.json();

	const mutation = gql`
		mutation ($teacherID: Int!, $name: String!, $reason: String!) {
			setPermanentNonInvigilator(teacherID: $teacherID, name: $name, reason: $reason) {
				teacherID
				name
				reason
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { teacherID, name, reason });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
