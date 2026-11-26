import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
import type { RequestHandler } from './$types';

// Termin einer Prüfung festhalten bzw. freigeben: „Terminplan generieren“ verschiebt
// eine festgehaltene Prüfung nicht. Ohne Termin antwortet das Backend mit NOT_FOUND.
export const POST: RequestHandler = async ({ request }) => {
	const { ancode, locked } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!, $locked: Boolean!) {
			setExamLocked(ancode: $ancode, locked: $locked) {
				ancode
				locked
			}
		}
	`;
	return gqlProxy(mutation, { ancode: Number(ancode), locked: Boolean(locked) });
};
