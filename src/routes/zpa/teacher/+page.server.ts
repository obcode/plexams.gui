import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

// Promise NICHT awaiten → SvelteKit streamt es: die Seite ist sofort da,
// die Tabelle füllt sich, sobald die (etwas langsamere) Query zurückkommt.
export const load: PageServerLoad = () => {
	const people = request<any>(
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
		.then((data) => {
			// Aufsichten (Teilmenge) je teacherID: present = ist Aufsicht, Wert = Anforderungen abgegeben?
			const invigById: Record<number, boolean> = {};
			for (const i of data.invigilators ?? []) invigById[i.teacher.id] = i.hasSubmittedRequirements;
			const teachers = (data.teachers ?? [])
				.slice()
				.sort((a: any, b: any) => a.shortname.localeCompare(b.shortname));
			return {
				teachers,
				invigById,
				invigilatorCount: Object.keys(invigById).length,
				missingReqCount: Object.values(invigById).filter((v) => !v).length,
				currentSemester: data.semester?.id ?? null
			};
		})
		.catch(() => ({
			teachers: [],
			invigById: {} as Record<number, boolean>,
			invigilatorCount: 0,
			missingReqCount: 0,
			currentSemester: null
		}));

	return { people };
};
