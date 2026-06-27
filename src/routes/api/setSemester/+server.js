import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name } = await request.json();
	const mutation = gql`
		mutation ($name: String!) {
			setSemester(name: $name) {
				id
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { name: String(name) });
		return json(data);
	} catch (e) {
		// z. B. „läuft gerade eine Operation" oder „Ziel hat keine Config"
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
