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
			invigilatorCandidates {
				id
				shortname
				fullname
			}
			permanentNonInvigilators {
				teacherID
				name
				reason
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

	// Kandidaten-Pool (enthält auch Ausgeschlossene — nötig für die Pflege).
	const candidates = (data.invigilatorCandidates ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));
	/** @type {Map<number, any>} */
	const teacherById = new Map(candidates.map((/** @type {any} */ t) => [t.id, t]));

	/** @param {number} id */
	const nameOf = (id) => {
		const t = teacherById.get(id);
		return { shortname: t?.shortname ?? `#${id}`, fullname: t?.fullname ?? '' };
	};

	const constraints = (data.invigilatorConstraints ?? [])
		.map((/** @type {any} */ c) => ({ ...c, ...nameOf(c.teacherID) }))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));

	// Permanente Nicht-Aufsichten (global, semesterübergreifend). Name kommt aus
	// dem Datensatz selbst — so bleiben auch Ehemalige (nicht mehr im Pool) lesbar.
	const permanent = (data.permanentNonInvigilators ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) =>
			(a.name ?? '').localeCompare(b.name ?? '')
		);

	return {
		constraints,
		candidates,
		permanent,
		days: data.semesterConfig?.days ?? []
	};
}
