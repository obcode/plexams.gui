import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const query = gql`
		query {
			connectedExams {
				zpaExam {
					ancode
					module
					mainExamer
					examType
					groups
				}
				primussExams {
					ancode
					module
					mainExamer
					program
					examType
				}
				otherPrimussExams {
					ancode
					module
					mainExamer
					program
				}
				warnings {
					level
					message
				}
			}
		}
	`;

	try {
		const data = await request(env.PLEXAMS_SERVER, query);
		return { connectedExams: data.connectedExams ?? [], loadError: null };
	} catch (e) {
		// z. B. wenn das Backend einen ungültigen Eintrag liefert — lieber eine
		// Meldung zeigen als die ganze Seite mit 500 abstürzen lassen.
		return {
			connectedExams: null,
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
}
