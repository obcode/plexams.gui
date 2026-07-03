import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		const data = await gqlrequest(
			env.PLEXAMS_SERVER,
			gql`
				mutation {
					generateStudentRegs {
						state {
							dirty
							reason
							changedAt
						}
						studentCount
					}
				}
			`
		);
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
