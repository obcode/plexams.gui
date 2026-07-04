import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
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

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	// Kandidaten-Pool (enthält auch Ausgeschlossene — nötig für die Pflege).
	const candidates = (data.invigilatorCandidates ?? [])
		.slice()
		.sort((a: any, b: any) => a.shortname.localeCompare(b.shortname));
	const teacherById = new Map<number, any>(candidates.map((t: any) => [t.id, t]));

	const nameOf = (id: number) => {
		const t = teacherById.get(id);
		return { shortname: t?.shortname ?? `#${id}`, fullname: t?.fullname ?? '' };
	};

	const constraints = (data.invigilatorConstraints ?? [])
		.map((c: any) => ({ ...c, ...nameOf(c.teacherID) }))
		.sort((a: any, b: any) => a.shortname.localeCompare(b.shortname));

	// Permanente Nicht-Aufsichten (global, semesterübergreifend). Name kommt aus
	// dem Datensatz selbst — so bleiben auch Ehemalige (nicht mehr im Pool) lesbar.
	const permanent = (data.permanentNonInvigilators ?? [])
		.slice()
		.sort((a: any, b: any) => (a.name ?? '').localeCompare(b.name ?? ''));

	return {
		constraints,
		candidates,
		permanent,
		days: data.semesterConfig?.days ?? []
	};
};
