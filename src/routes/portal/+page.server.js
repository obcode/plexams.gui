import { gql } from 'graphql-request';
import { portalRequest } from '$lib/server/backend';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	// Ein älteres Backend kennt `inquiries` noch nicht – dann eben ohne Abfragen.
	try {
		const data = await portalRequest(gql`
			query {
				inquiries {
					semester
					kind
					open
					deadline
					intro
					affected
					nothingToReport
				}
			}
		`);
		return { inquiries: data.inquiries };
	} catch {
		return { inquiries: [] };
	}
}
