import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

const ZPA_FIELDS = `
	ancode
	module
	mainExamer
	mainExamerID
	examType
	examTypeFull
	duration
	isRepeaterExam
	groups
	primussAncodes {
		program
		ancode
	}
`;

export async function load() {
	const query = gql`
		query {
			toPlan: zpaExamsToPlanWithConstraints {
				zpaExam {
					${ZPA_FIELDS}
				}
				constraints {
					ancode
					notPlannedByMe
					online
					excludeDays
					possibleDays
					sameSlot
					roomConstraints {
						allowedRooms
						placesWithSocket
						lab
						exahm
						seb
						kdpJiraURL
						maxStudents
						comments
					}
				}
			}
			notToPlan: zpaExamsNotToPlan {
				${ZPA_FIELDS}
			}
			unknown: zpaExamsPlaningStatusUnknown {
				ancode
				module
				mainExamer
				mainExamerID
				examType
				examTypeFull
				duration
				isRepeaterExam
				groups
			}
			semesterConfig {
				days {
					number
					date
				}
			}
			rooms {
				name
			}
			plannedExams {
				ancode
				planEntry {
					dayNumber
					slotNumber
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Ancode → Slot (für „schon vorgeplant")
	/** @type {Record<number, {dayNumber:number, slotNumber:number}>} */
	const slotByAncode = {};
	for (const pe of data.plannedExams ?? []) {
		if (pe.planEntry && pe.planEntry.slotNumber != null) slotByAncode[pe.ancode] = pe.planEntry;
	}

	/** @type {any[]} */
	const items = [
		...(data.toPlan ?? []).map((/** @type {any} */ x) => ({
			...x.zpaExam,
			status: 'toPlan',
			constraints: x.constraints ?? null,
			slot: slotByAncode[x.zpaExam.ancode] ?? null
		})),
		...(data.notToPlan ?? []).map((/** @type {any} */ e) => ({
			...e,
			status: 'notToPlan',
			constraints: null,
			slot: slotByAncode[e.ancode] ?? null
		})),
		...(data.unknown ?? []).map((/** @type {any} */ e) => ({
			...e,
			status: 'unknown',
			constraints: null,
			primussAncodes: [],
			slot: slotByAncode[e.ancode] ?? null
		}))
	].sort((a, b) => a.ancode - b.ancode);

	return {
		items,
		days: data.semesterConfig?.days ?? [],
		rooms: (data.rooms ?? []).map((/** @type {any} */ r) => r.name)
	};
}
