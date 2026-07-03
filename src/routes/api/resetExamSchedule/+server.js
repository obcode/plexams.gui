import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

// Generierten Terminplan zurücksetzen (destruktiv). Gibt die Anzahl entfernter
// Prüfungen zurück. Manuell gesperrte, externe und phasenfixierte EXaHM/SEB-
// Prüfungen bleiben erhalten; bei veröffentlichtem Plan liefert das Backend
// einen Fehler.
/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const mutation = gql`
		mutation {
			resetExamSchedule
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation);
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
