import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import { GENERATION_CONFIG_FIELDS } from '$lib/semester/generationConfig';
import type { PageServerLoad } from './$types';

// Terminplan-Generierung: Gate (EXAMS in blockedAreas → Schreiben gesperrt), die
// aktuell angewandten Constraints (read-only) sowie der Konflikt-Loop (Konflikte
// des aktuellen Plans, Per-Studierenden-Akzeptanzen, canShareSlot-Vorschläge/-Paare).
const PAIR_FIELDS = `
	ancode1
	module1
	mainExamer1
	ancode2
	module2
	mainExamer2
`;

export const load: PageServerLoad = async () => {
	const out = {
		blockedAreas: [] as string[],
		constraints: [] as any[],
		// volles Config-Input für den examGapMinutes-Round-Trip
		semesterConfigInput: null as any,
		// volle generationConfig für den slotTime-Round-Trip (Input ist komplett non-null)
		generationConfig: null as any,
		loadError: '',
		conflicts: [] as any[],
		decisions: [] as any[],
		suggestions: [] as any[],
		shareList: [] as any[],
		conflictsError: ''
	};

	try {
		const data = await backendRequest(gql`
				query {
					planningState {
						blockedAreas
					}
					examScheduleConstraints {
						name
						title
						description
						kind
						weight
						tier
					}
					generationConfig {
						${GENERATION_CONFIG_FIELDS}
					}
					semesterConfigInput {
						from
						until
						examGapMinutes
						startTimes
						forbiddenDays
						mucDaiAllowedTimes
						timelagMin
						notTooCloseMinutes
						emails {
							profs
							lbas
							lbasLastSemester
							additionalExamer
							fs
							sekr
							roomManagement
							kdp
							lbaba
						}
					}
				}
			`);
		out.blockedAreas = data.planningState?.blockedAreas ?? [];
		out.constraints = [...(data.examScheduleConstraints ?? [])].sort(
			(a: any, b: any) => a.tier - b.tier
		);
		out.generationConfig = data.generationConfig ?? null;
		out.semesterConfigInput = data.semesterConfigInput ?? null;
	} catch (e) {
		out.loadError = gqlErrorMessage(e);
	}

	// Konflikt-Daten separat: ohne generierten Plan kann das (noch) fehlschlagen —
	// dann bleibt der Bereich leer statt die Seite zu killen.
	try {
		const cd = await backendRequest(gql`
				query {
					examScheduleConflicts {
						ancode1
						module1
						mainExamer1
						groups1
						isRepeaterExam1
						location1
						slot1 {
							starttime
						}
						ancode2
						module2
						mainExamer2
						groups2
						isRepeaterExam2
						location2
						slot2 {
							starttime
						}
						studentCount
						proximity
						canShareSlot
						infoOnly
						diffStatus
						affectedStudents {
							mtknr
							name
							program
							group
							autoAccepted
							decision
							accepted
						}
					}
					studentConflictDecisions {
						ancode1
						ancode2
						mtknr
						decision
					}
					canShareSlotSuggestions {
						${PAIR_FIELDS}
					}
					examsCanShareSlot {
						${PAIR_FIELDS}
					}
				}
			`);
		out.conflicts = cd.examScheduleConflicts ?? [];
		out.decisions = cd.studentConflictDecisions ?? [];
		out.suggestions = cd.canShareSlotSuggestions ?? [];
		out.shareList = cd.examsCanShareSlot ?? [];
	} catch (e) {
		out.conflictsError = gqlErrorMessage(e);
	}

	return out;
};
