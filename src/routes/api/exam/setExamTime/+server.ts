import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Manuelle Platzierung: setzt die absolute Startzeit einer Prüfung. Tag/Slot leitet
// das Backend daraus ab (0, wenn außerhalb des Zeitraums). Das Backend akzeptiert jede
// Zeit; die „keine Standard-Anfangszeit"-Warnung ist rein client-seitig (siehe
// $lib/exam/setExamTime).
export const POST: RequestHandler = async ({ request }) => {
	const { ancode, starttime } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!, $starttime: Time!) {
			setExamTime(ancode: $ancode, starttime: $starttime)
		}
	`;
	return gqlProxy(mutation, { ancode: Number(ancode), starttime: String(starttime) });
};
