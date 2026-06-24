import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
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
	);

	// Aufsichten (Teilmenge) je teacherID: present = ist Aufsicht, Wert = Anforderungen abgegeben?
	/** @type {Record<number, boolean>} */
	const invigById = {};
	for (const i of data.invigilators ?? []) invigById[i.teacher.id] = i.hasSubmittedRequirements;

	const teachers = (data.teachers ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));

	return {
		teachers,
		invigById,
		invigilatorCount: Object.keys(invigById).length,
		missingReqCount: Object.values(invigById).filter((/** @type {boolean} */ v) => !v).length
	};
}
