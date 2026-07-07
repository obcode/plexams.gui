import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const query = gql`
		query {
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
			plannedRoomNames
			prePlannedRooms {
				ancode
				roomName
				mtknr
				seats
			}
			plannedRooms {
				starttime
				prePlanned
				room {
					name
				}
			}
			plannedExams {
				ancode
				zpaExam {
					module
					mainExamer
				}
			}
			unplacedExams {
				ancode
				starttime
				mtknrs
				ntaMtknr
			}
			blockedRooms {
				room
				starttime
				reason
			}
			planningState {
				blockedAreas
			}
		}
	`;

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	// Zeitbasiert: PlannedRoom/UnplacedExam/BlockedRoom liefern nur noch starttime.
	// day/slot werden hier lokal aus der Startzeit + semesterConfig abgeleitet, damit
	// die (day-slot)-Keys/Anzeigen unverändert bleiben.
	const cfgDays = data.semesterConfig?.days ?? [];
	const cfgStarts = data.semesterConfig?.starttimes ?? [];
	const dayOf = (st: string) => dayNumberForTime(st, cfgDays);
	const slotOf = (st: string) => slotNumberForTime(st, cfgStarts);

	// Nicht zugeordnete Studierende (kommen nicht mehr als „No Room" aus
	// plannedRooms, sondern aus unplacedExams). Modul/Prüfer per ancode joinen.
	const examByAncode = new Map<number, any>(
		(data.plannedExams ?? []).map((e: any) => [e.ancode, e])
	);
	const unplaced = (data.unplacedExams ?? [])
		.map((u: any) => {
			const ex = examByAncode.get(u.ancode);
			return {
				ancode: u.ancode,
				module: ex?.zpaExam?.module ?? '',
				mainExamer: ex?.zpaExam?.mainExamer ?? '',
				day: dayOf(u.starttime),
				slot: slotOf(u.starttime),
				count: (u.mtknrs ?? []).length,
				nta: u.ntaMtknr != null
			};
		})
		.filter((u: any) => u.count > 0)
		.sort((a: any, b: any) => a.day - b.day || a.slot - b.slot || a.ancode - b.ancode);
	const totalUnplaced = unplaced.reduce((s: number, u: any) => s + u.count, 0);
	// Ancodes mit nicht zugeordneten Studierenden — für den „nur ohne Raum"-Filter.
	const unplacedAncodes = new Set<number>(unplaced.map((u: any) => u.ancode));

	// Set für die „nach Räumen"-Übersicht: welcher Raum ist in welchem day-slot
	// geplant. (devalue serialisiert Sets über die SvelteKit-Grenze.)
	const plannedRooms = new Set(
		(data.plannedRooms ?? []).map(
			(r: any) => `${dayOf(r.starttime)}-${slotOf(r.starttime)}-${r.room.name}`
		)
	);

	// vorgeplante (gepinnte) Räume je Slot — für den Hinweis beim Sperren.
	const prePlannedRooms = new Set(
		(data.plannedRooms ?? [])
			.filter((r: any) => r.prePlanned)
			.map((r: any) => `${dayOf(r.starttime)}-${slotOf(r.starttime)}-${r.room.name}`)
	);

	// Wie oft (in wie vielen Slots) ist jeder Raum geplant?
	const roomSlotSets: Record<string, Set<string>> = {};
	for (const r of data.plannedRooms ?? []) {
		(roomSlotSets[r.room.name] ??= new Set()).add(`${dayOf(r.starttime)}-${slotOf(r.starttime)}`);
	}
	const roomCounts: Record<string, number> = {};
	for (const [name, set] of Object.entries(roomSlotSets)) roomCounts[name] = set.size;

	// fix vorgeplante Platzzahlen je (ancode|raum|mtknr) — für die Anzeige „N Plätze (fix)"
	const prePlannedSeats: Record<string, number> = {};
	for (const p of data.prePlannedRooms ?? []) {
		if (p.seats != null) prePlannedSeats[`${p.ancode}|${p.roomName}|${p.mtknr ?? ''}`] = p.seats;
	}

	return {
		semesterConfig: data.semesterConfig,
		plannedRoomNames: data.plannedRoomNames,
		prePlannedSeats,
		plannedRooms,
		prePlannedRooms,
		roomCounts,
		unplaced,
		totalUnplaced,
		unplacedAncodes,
		blockedRooms: (data.blockedRooms ?? []).map((b: any) => ({
			room: b.room,
			day: dayOf(b.starttime),
			slot: slotOf(b.starttime),
			reason: b.reason
		})),
		roomsBlocked: (data.planningState?.blockedAreas ?? []).includes('ROOMS')
	};
};
