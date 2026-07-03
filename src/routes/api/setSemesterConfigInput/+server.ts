import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();

	const mutation = gql`
		mutation ($input: SemesterConfigInputData!) {
			setSemesterConfigInput(input: $input) {
				ok
				warnings
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { input });
		return json(data);
	} catch (e) {
		// Validierungsfehler (ungültiges Datum/Slot-Format, …)
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
