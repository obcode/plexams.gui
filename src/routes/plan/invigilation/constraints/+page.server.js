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
			teachers(fromZPA: false) {
				id
				shortname
				fullname
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

	// Lehrendenname je teacherID joinen.
	/** @type {Map<number, any>} */
	const teacherById = new Map((data.teachers ?? []).map((/** @type {any} */ t) => [t.id, t]));
	const constraints = (data.invigilatorConstraints ?? [])
		.map((/** @type {any} */ c) => {
			const t = teacherById.get(c.teacherID);
			return { ...c, shortname: t?.shortname ?? `#${c.teacherID}`, fullname: t?.fullname ?? '' };
		})
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));

	return {
		constraints,
		teachers: (data.teachers ?? []).sort((/** @type {any} */ a, /** @type {any} */ b) =>
			a.shortname.localeCompare(b.shortname)
		),
		days: data.semesterConfig?.days ?? []
	};
}
