import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

type PermanentNonInvigilator = {
	teacherID: number;
	name: string;
	reason: string;
	validFrom: string | null;
	validUntil: string | null;
};
type InvigilatorCandidate = { id: number; shortname: string; fullname: string };
type Semester = { id: string };

// A "real" semester label like 2026-SS / 2025-WS (excludes test/clone workspaces),
// so the validity dropdowns only offer meaningful semesters.
const SEM_RE = /^(\d{4})-(SS|WS)$/;
const semKey = (id: string) => {
	const m = SEM_RE.exec(id);
	if (!m) return -1;
	return Number(m[1]) * 10 + (m[2] === 'SS' ? 1 : 2);
};

export const load: PageServerLoad = async () => {
	const data = await backendRequest<{
		permanentNonInvigilators: PermanentNonInvigilator[];
		invigilatorCandidates: InvigilatorCandidate[];
		allSemesterNames: Semester[];
	}>(gql`
		query {
			permanentNonInvigilators {
				teacherID
				name
				reason
				validFrom
				validUntil
			}
			invigilatorCandidates {
				id
				shortname
				fullname
			}
			allSemesterNames {
				id
			}
		}
	`);

	const candidates = (data.invigilatorCandidates ?? [])
		.slice()
		.sort((a, b) => a.shortname.localeCompare(b.shortname));
	const permanent = (data.permanentNonInvigilators ?? [])
		.slice()
		.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
	const semesters = (data.allSemesterNames ?? [])
		.map((s) => s.id)
		.filter((id) => SEM_RE.test(id))
		.sort((a, b) => semKey(b) - semKey(a)); // neuestes zuerst

	return { permanent, candidates, semesters };
};
