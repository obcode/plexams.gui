import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';
import { ZPA_EXAM_FIELDS as ZPA_FIELDS } from '$lib/gql/fragments';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const query = gql`
		query {
			toPlan: zpaExamsToPlanWithConstraints {
				zpaExam {
					${ZPA_FIELDS}
				}
				constraints {
					ancode
					notPlannedByMe
					notPlannedByMeInFK
					location
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
					starttime
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

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	// Prüfer-ID → Fakultät (z. B. „FK07"), für den „nicht-FK07"-Filter.
	const fkById: Record<number, string> = {};
	for (const t of data.teachers ?? []) fkById[t.id] = t.fk ?? '';

	// Ancode → manuell gesetzte Dauer (nur bei ZPA-Dauer 0 relevant)
	const durOverride: Record<number, number> = {};
	for (const o of data.examDurationOverrides ?? []) durOverride[o.ancode] = o.duration;

	// „vorgeplant": es gibt einen echten planEntry (Slot im Plan) ODER die
	// verknüpfte Pre-Exam ist FIXIERT. Ein bloß vorläufiger (nicht-fixierter)
	// Pre-Plan-Slot zählt NICHT — der kann beim „Automatisch verteilen" umziehen.
	const planned: Record<
		number,
		{ slot: { dayNumber: number; slotNumber: number } | null; preplanned: boolean }
	> = {};
	for (const pe of data.plannedExams ?? []) {
		if (pe.planEntry?.starttime) {
			// Zeitbasiert: Tag/Slot aus starttime ableiten (day/slot gibt es nicht mehr).
			const slot = {
				dayNumber: dayNumberForTime(pe.planEntry.starttime, data.semesterConfig.days),
				slotNumber: slotNumberForTime(pe.planEntry.starttime, data.semesterConfig.starttimes)
			};
			planned[pe.ancode] = { slot, preplanned: true };
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

	const items: any[] = [
		...(data.toPlan ?? []).map((x: any) => ({
			...x.zpaExam,
			status: 'toPlan',
			constraints: x.constraints ?? null,
			examerFk: fkById[x.zpaExam.mainExamerID] ?? '',
			slot: planned[x.zpaExam.ancode]?.slot ?? null,
			preplanned: !!planned[x.zpaExam.ancode]?.preplanned,
			durationOverride: durOverride[x.zpaExam.ancode] ?? null
		})),
		...(data.notToPlan ?? []).map((e: any) => ({
			...e,
			status: 'notToPlan',
			constraints: null,
			examerFk: fkById[e.mainExamerID] ?? '',
			slot: planned[e.ancode]?.slot ?? null,
			preplanned: !!planned[e.ancode]?.preplanned,
			durationOverride: durOverride[e.ancode] ?? null
		})),
		...(data.unknown ?? []).map((e: any) => ({
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
		rooms: (data.rooms ?? []).map((r: any) => r.name)
	};
};
