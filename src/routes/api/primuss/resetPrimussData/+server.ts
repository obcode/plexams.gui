import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Destruktiv: löscht alle importierten Primuss-Sammellisten und liefert die
// Liste der geleerten Studiengänge zurück. Das Backend blockt den Reset, wenn
// gerade eine Validierung/Transfer/E-Mail läuft ({ error } mit HTTP 400).
export const POST: RequestHandler = () =>
	gqlProxy(gql`
		mutation {
			resetPrimussData
		}
	`);
