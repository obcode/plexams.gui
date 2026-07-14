import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
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
		const data = await backendRequest(query);

		// Studiengang → Primuss-Prüfungen (für „anderes Primuss-Exam hinzufügen")
		const primussByProgram: Record<
			string,
			{ ancode: number; module: string; mainExamer: string }[]
		> = {};
		for (const pe of data.primussExams ?? []) {
			primussByProgram[pe.program] = (pe.exams ?? [])
				.map((e: any) => ({
					ancode: e.ancode,
					module: e.module,
					mainExamer: e.mainExamer
				}))
				.sort((a: any, b: any) => a.ancode - b.ancode);
		}

		return { connectedExams: data.connectedExams ?? [], primussByProgram, loadError: null };
	} catch (e) {
		// z. B. wenn das Backend einen ungültigen Eintrag liefert — lieber eine
		// Meldung zeigen als die ganze Seite mit 500 abstürzen lassen.
		return {
			connectedExams: null,
			primussByProgram: {} as Record<
				string,
				{ ancode: number; module: string; mainExamer: string }[]
			>,
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
};
