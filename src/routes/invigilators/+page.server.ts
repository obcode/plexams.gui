import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

type PermanentNonInvigilator = { teacherID: number; name: string; reason: string };
type InvigilatorCandidate = { id: number; shortname: string; fullname: string };

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
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
	`);

	const candidates = (data.invigilatorCandidates ?? [])
		.slice()
		.sort((a, b) => a.shortname.localeCompare(b.shortname));
	const permanent = (data.permanentNonInvigilators ?? [])
		.slice()
		.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

	return { permanent, candidates };
};
