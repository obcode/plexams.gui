import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

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
	return gqlProxy(mutation);
}
