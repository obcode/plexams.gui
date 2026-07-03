import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

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

export async function load() {
	const out = {
		blockedAreas: /** @type {string[]} */ ([]),
		constraints: /** @type {any[]} */ ([]),
		/** @type {any} volles Config-Input für den examGapMinutes-Round-Trip */
		semesterConfigInput: null,
		loadError: '',
		conflicts: /** @type {any[]} */ ([]),
		decisions: /** @type {any[]} */ ([]),
		suggestions: /** @type {any[]} */ ([]),
		shareList: /** @type {any[]} */ ([]),
		conflictsError: ''
	};

	try {
		const data = await request(
			env.PLEXAMS_SERVER,
			gql`
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
					semesterConfigInput {
						from
						until
						examGapMinutes
						slots
						forbiddenDays
						mucDaiSlots
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
			`
		);
		out.blockedAreas = data.planningState?.blockedAreas ?? [];
		out.constraints = [...(data.examScheduleConstraints ?? [])].sort(
			(/** @type {any} */ a, /** @type {any} */ b) => a.tier - b.tier
		);
		out.semesterConfigInput = data.semesterConfigInput ?? null;
	} catch (e) {
		out.loadError = gqlErrorMessage(e);
	}

	// Konflikt-Daten separat: ohne generierten Plan kann das (noch) fehlschlagen —
	// dann bleibt der Bereich leer statt die Seite zu killen.
	try {
		const cd = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
					examScheduleConflicts {
						ancode1
						module1
						mainExamer1
						groups1
						isRepeaterExam1
						location1
						slot1 {
							dayNumber
							slotNumber
							starttime
						}
						ancode2
						module2
						mainExamer2
						groups2
						isRepeaterExam2
						location2
						slot2 {
							dayNumber
							slotNumber
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
			`
		);
		out.conflicts = cd.examScheduleConflicts ?? [];
		out.decisions = cd.studentConflictDecisions ?? [];
		out.suggestions = cd.canShareSlotSuggestions ?? [];
		out.shareList = cd.examsCanShareSlot ?? [];
	} catch (e) {
		out.conflictsError = gqlErrorMessage(e);
	}

	return out;
}
