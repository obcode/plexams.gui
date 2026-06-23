import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const query = gql`
		query {
			invigilatorConstraints {
				teacherID
				isNotInvigilator
				excludedDates
				timeWindows {
					date
					from
					until
				}
			}
			invigilators {
				teacher {
					id
					shortname
					fullname
				}
			}
			semesterConfig {
				days {
					number
					date
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Aufsichten (nur diese sind wählbar); Name je teacherID joinen.
	const invigilators = (data.invigilators ?? [])
		.map((/** @type {any} */ i) => i.teacher)
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));
	/** @type {Map<number, any>} */
	const teacherById = new Map(invigilators.map((/** @type {any} */ t) => [t.id, t]));
	const constraints = (data.invigilatorConstraints ?? [])
		.map((/** @type {any} */ c) => {
			const t = teacherById.get(c.teacherID);
			return { ...c, shortname: t?.shortname ?? `#${c.teacherID}`, fullname: t?.fullname ?? '' };
		})
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));

	return {
		constraints,
		invigilators,
		days: data.semesterConfig?.days ?? []
	};
}
