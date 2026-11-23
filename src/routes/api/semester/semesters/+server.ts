import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import { gqlErrorMessage } from '#lib/gqlError.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const data = await backendRequest(gql`
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
		`);
		return Response.json({ current: data.semester ?? null, all: data.allSemesterNames ?? [] });
	} catch (e) {
		return Response.json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
