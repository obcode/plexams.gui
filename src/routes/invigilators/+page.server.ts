import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type PermanentNonInvigilator = { teacherID: number; name: string; reason: string };
type InvigilatorCandidate = { id: number; shortname: string; fullname: string };

export const load: PageServerLoad = async () => {
	const data = await request<{
		permanentNonInvigilators: PermanentNonInvigilator[];
		invigilatorCandidates: InvigilatorCandidate[];
	}>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				permanentNonInvigilators {
					teacherID
					name
					reason
				}
				invigilatorCandidates {
					id
					shortname
					fullname
				}
			}
		`
	);

	const candidates = (data.invigilatorCandidates ?? [])
		.slice()
		.sort((a, b) => a.shortname.localeCompare(b.shortname));
	const permanent = (data.permanentNonInvigilators ?? [])
		.slice()
		.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

	return { permanent, candidates };
};
