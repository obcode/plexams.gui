import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

// Terminplan-Generierung: Gate (EXAMS in blockedAreas → Schreiben gesperrt), die
// aktuell angewandten Constraints (read-only) sowie der Konflikt-Bewertungs-Loop
// (Konflikte des aktuellen Plans, Bewertungen, canShareSlot-Vorschläge/-Paare).
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
		loadError: '',
		conflicts: /** @type {any[]} */ ([]),
		ratings: /** @type {any[]} */ ([]),
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
				}
			`
		);
		out.blockedAreas = data.planningState?.blockedAreas ?? [];
		out.constraints = [...(data.examScheduleConstraints ?? [])].sort(
			(/** @type {any} */ a, /** @type {any} */ b) => a.tier - b.tier
		);
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
						ancode2
						module2
						mainExamer2
						studentCount
						proximity
						rating
						canShareSlot
						infoOnly
						affectedStudents {
							mtknr
							name
							accepted
						}
					}
					examConflictRatings {
						ancode1
						ancode2
						rating
						mtknr
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
		out.ratings = cd.examConflictRatings ?? [];
		out.suggestions = cd.canShareSlotSuggestions ?? [];
		out.shareList = cd.examsCanShareSlot ?? [];
	} catch (e) {
		out.conflictsError = gqlErrorMessage(e);
	}

	return out;
}
