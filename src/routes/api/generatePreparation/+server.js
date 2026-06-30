import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Aufbereitete Prüfungen UND StudentRegs in einem Schritt erzeugen.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST() {
	try {
		const data = await gqlrequest(
			env.PLEXAMS_SERVER,
			gql`
				mutation {
					generatePreparation {
						assembledExams {
							state {
								dirty
								reason
								changedAt
							}
							changes {
								ancode
								module
								kind
								details
							}
						}
						studentRegs {
							state {
								dirty
								reason
								changedAt
							}
							studentCount
						}
					}
				}
			`
		);
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
