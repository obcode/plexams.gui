import { json } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const data = await backendRequest(gql`
			query {
				semester {
					id
					semester
					compatible
					readOnly
					schemaVersion
				}
				allSemesterNames {
					id
					semester
					compatible
					readOnly
					schemaVersion
				}
			}
		`);
		return json({ current: data.semester ?? null, all: data.allSemesterNames ?? [] });
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
