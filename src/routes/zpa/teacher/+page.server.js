import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

// Promise NICHT awaiten → SvelteKit streamt es: die Seite ist sofort da,
// die Tabelle füllt sich, sobald die (etwas langsamere) Query zurückkommt.
export function load() {
	const people = request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				semester {
					id
				}
				teachers(fromZPA: false) {
					fullname
					shortname
					isProf
					isLBA
					isProfHC
					isStaff
					lastSemester
					fk
					id
					email
				}
				invigilators {
					teacher {
						id
					}
					hasSubmittedRequirements
				}
			}
		`
	)
		.then((/** @type {any} */ data) => {
			// Aufsichten (Teilmenge) je teacherID: present = ist Aufsicht, Wert = Anforderungen abgegeben?
			/** @type {Record<number, boolean>} */
			const invigById = {};
			for (const i of data.invigilators ?? []) invigById[i.teacher.id] = i.hasSubmittedRequirements;
			const teachers = (data.teachers ?? [])
				.slice()
				.sort((/** @type {any} */ a, /** @type {any} */ b) =>
					a.shortname.localeCompare(b.shortname)
				);
			return {
				teachers,
				invigById,
				invigilatorCount: Object.keys(invigById).length,
				missingReqCount: Object.values(invigById).filter((/** @type {boolean} */ v) => !v).length,
				currentSemester: data.semester?.id ?? null
			};
		})
		.catch(() => ({
			teachers: [],
			invigById: {},
			invigilatorCount: 0,
			missingReqCount: 0,
			currentSemester: null
		}));

	return { people };
}
