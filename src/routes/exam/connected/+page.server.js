import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';

export async function load() {
	const query = gql`
		query {
			connectedExams {
				${CONNECTED_EXAM_FIELDS}
			}
			primussExams {
				program
				exams {
					ancode
					module
					mainExamer
				}
			}
		}
	`;

	try {
		const data = await request(env.PLEXAMS_SERVER, query);

		// Studiengang → Primuss-Prüfungen (für „anderes Primuss-Exam hinzufügen")
		/** @type {Record<string, {ancode:number, module:string, mainExamer:string}[]>} */
		const primussByProgram = {};
		for (const pe of data.primussExams ?? []) {
			primussByProgram[pe.program] = (pe.exams ?? [])
				.map((/** @type {any} */ e) => ({
					ancode: e.ancode,
					module: e.module,
					mainExamer: e.mainExamer
				}))
				.sort((/** @type {any} */ a, /** @type {any} */ b) => a.ancode - b.ancode);
		}

		return { connectedExams: data.connectedExams ?? [], primussByProgram, loadError: null };
	} catch (e) {
		// z. B. wenn das Backend einen ungültigen Eintrag liefert — lieber eine
		// Meldung zeigen als die ganze Seite mit 500 abstürzen lassen.
		return {
			connectedExams: null,
			primussByProgram: {},
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
}
