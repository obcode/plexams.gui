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
					doNotPublish
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
						additionalSeats
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
				starttimes {
					number
					start
				}
			}
			rooms {
				name
			}
			teachers(fromZPA: false) {
				id
				fk
			}
			plannedExams {
				ancode
				planEntry {
					dayNumber
					slotNumber
				}
			}
			preplanExams {
				ancode
				isFixed
				plannedDayNumber
				plannedSlotNumber
			}
			examDurationOverrides {
				ancode
				duration
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Prüfer-ID → Fakultät (z. B. „FK07"), für den „nicht-FK07"-Filter.
	/** @type {Record<number, string>} */
	const fkById = {};
	for (const t of data.teachers ?? []) fkById[t.id] = t.fk ?? '';

	// Ancode → manuell gesetzte Dauer (nur bei ZPA-Dauer 0 relevant)
	/** @type {Record<number, number>} */
	const durOverride = {};
	for (const o of data.examDurationOverrides ?? []) durOverride[o.ancode] = o.duration;

	// „vorgeplant": es gibt einen echten planEntry (Slot im Plan) ODER die
	// verknüpfte Pre-Exam ist FIXIERT. Ein bloß vorläufiger (nicht-fixierter)
	// Pre-Plan-Slot zählt NICHT — der kann beim „Automatisch verteilen" umziehen.
	/** @type {Record<number, {slot: {dayNumber:number, slotNumber:number}|null, preplanned:boolean}>} */
	const planned = {};
	for (const pe of data.plannedExams ?? []) {
		if (pe.planEntry && pe.planEntry.slotNumber != null) {
			planned[pe.ancode] = { slot: pe.planEntry, preplanned: true };
		}
	}
	for (const pp of data.preplanExams ?? []) {
		if (pp.ancode == null || !pp.isFixed) continue;
		const slot =
			pp.plannedSlotNumber != null
				? { dayNumber: pp.plannedDayNumber, slotNumber: pp.plannedSlotNumber }
				: null;
		planned[pp.ancode] = planned[pp.ancode] ?? { slot, preplanned: true };
		planned[pp.ancode].preplanned = true;
		if (!planned[pp.ancode].slot && slot) planned[pp.ancode].slot = slot;
	}

	/** @type {any[]} */
	const items = [
		...(data.toPlan ?? []).map((/** @type {any} */ x) => ({
			...x.zpaExam,
			status: 'toPlan',
			constraints: x.constraints ?? null,
			examerFk: fkById[x.zpaExam.mainExamerID] ?? '',
			slot: planned[x.zpaExam.ancode]?.slot ?? null,
			preplanned: !!planned[x.zpaExam.ancode]?.preplanned,
			durationOverride: durOverride[x.zpaExam.ancode] ?? null
		})),
		...(data.notToPlan ?? []).map((/** @type {any} */ e) => ({
			...e,
			status: 'notToPlan',
			constraints: null,
			examerFk: fkById[e.mainExamerID] ?? '',
			slot: planned[e.ancode]?.slot ?? null,
			preplanned: !!planned[e.ancode]?.preplanned,
			durationOverride: durOverride[e.ancode] ?? null
		})),
		...(data.unknown ?? []).map((/** @type {any} */ e) => ({
			...e,
			status: 'unknown',
			constraints: null,
			examerFk: fkById[e.mainExamerID] ?? '',
			primussAncodes: [],
			slot: planned[e.ancode]?.slot ?? null,
			preplanned: !!planned[e.ancode]?.preplanned
		}))
	].sort((a, b) => a.ancode - b.ancode);

	return {
		items,
		days: data.semesterConfig?.days ?? [],
		starttimes: data.semesterConfig?.starttimes ?? [],
		rooms: (data.rooms ?? []).map((/** @type {any} */ r) => r.name)
	};
}
