import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Generierten Terminplan zurücksetzen (destruktiv). Gibt die Anzahl entfernter
// Prüfungen zurück. Manuell gesperrte, externe und phasenfixierte EXaHM/SEB-
// Prüfungen bleiben erhalten; bei veröffentlichtem Plan liefert das Backend
// einen Fehler.
export const POST: RequestHandler = () =>
	gqlProxy(gql`
		mutation {
			resetExamSchedule
		}
	`);
