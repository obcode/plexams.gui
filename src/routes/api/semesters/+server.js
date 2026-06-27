import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const data = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
					semester {
						id
						compatible
						readOnly
						schemaVersion
					}
					allSemesterNames {
						id
						compatible
						readOnly
						schemaVersion
					}
				}
			`
		);
		return json({ current: data.semester ?? null, all: data.allSemesterNames ?? [] });
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
