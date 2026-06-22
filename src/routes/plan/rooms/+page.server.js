import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
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
				day
				slot
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
				day
				slot
				mtknrs
				ntaMtknr
			}
			blockedRooms {
				room
				day
				slot
				reason
			}
			planningState {
				blockedAreas
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Nicht zugeordnete Studierende (kommen nicht mehr als „No Room" aus
	// plannedRooms, sondern aus unplacedExams). Modul/Prüfer per ancode joinen.
	/** @type {Map<number, any>} */
	const examByAncode = new Map(
		(data.plannedExams ?? []).map((/** @type {any} */ e) => [e.ancode, e])
	);
	const unplaced = (data.unplacedExams ?? [])
		.map((/** @type {any} */ u) => {
			const ex = examByAncode.get(u.ancode);
			return {
				ancode: u.ancode,
				module: ex?.zpaExam?.module ?? '',
				mainExamer: ex?.zpaExam?.mainExamer ?? '',
				day: u.day ?? null,
				slot: u.slot ?? null,
				count: (u.mtknrs ?? []).length,
				nta: u.ntaMtknr != null
			};
		})
		.filter((/** @type {any} */ u) => u.count > 0)
		.sort(
			(/** @type {any} */ a, /** @type {any} */ b) =>
				a.day - b.day || a.slot - b.slot || a.ancode - b.ancode
		);
	const totalUnplaced = unplaced.reduce(
		(/** @type {number} */ s, /** @type {any} */ u) => s + u.count,
		0
	);
	// Ancodes mit nicht zugeordneten Studierenden — für den „nur ohne Raum"-Filter.
	const unplacedAncodes = new Set(unplaced.map((/** @type {any} */ u) => u.ancode));

	// Set für die „nach Räumen"-Übersicht: welcher Raum ist in welchem day-slot
	// geplant. (devalue serialisiert Sets über die SvelteKit-Grenze.)
	const plannedRooms = new Set(
		(data.plannedRooms ?? []).map((/** @type {any} */ r) => `${r.day}-${r.slot}-${r.room.name}`)
	);

	// vorgeplante (gepinnte) Räume je Slot — für den Hinweis beim Sperren.
	const prePlannedRooms = new Set(
		(data.plannedRooms ?? [])
			.filter((/** @type {any} */ r) => r.prePlanned)
			.map((/** @type {any} */ r) => `${r.day}-${r.slot}-${r.room.name}`)
	);

	// Wie oft (in wie vielen Slots) ist jeder Raum geplant?
	/** @type {Record<string, Set<string>>} */
	const roomSlotSets = {};
	for (const r of data.plannedRooms ?? []) {
		(roomSlotSets[r.room.name] ??= new Set()).add(`${r.day}-${r.slot}`);
	}
	/** @type {Record<string, number>} */
	const roomCounts = {};
	for (const [name, set] of Object.entries(roomSlotSets)) roomCounts[name] = set.size;

	// fix vorgeplante Platzzahlen je (ancode|raum|mtknr) — für die Anzeige „N Plätze (fix)"
	/** @type {Record<string, number>} */
	const prePlannedSeats = {};
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
		blockedRooms: data.blockedRooms ?? [],
		roomsBlocked: (data.planningState?.blockedAreas ?? []).includes('ROOMS')
	};
}
