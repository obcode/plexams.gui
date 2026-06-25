import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			primussExams {
				program
				exams {
					ancode
					module
					mainExamer
					program
					examType
					presence
					studentRegsCount
				}
			}
			studyPrograms {
				shortname
				category
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Programm-Kürzel → Kategorie (fk07 | mucdai | misc); unbekannte → Sonstige
	/** @type {Record<string, string>} */
	const catByProgram = {};
	for (const sp of data.studyPrograms ?? []) {
		catByProgram[sp.shortname] = sp.category;
	}

	return {
		primussExams: data.primussExams,
		catByProgram
	};
}
