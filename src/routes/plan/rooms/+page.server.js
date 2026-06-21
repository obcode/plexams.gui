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
			plannedRooms {
				day
				slot
				room {
					name
				}
			}
			plannedExams {
				ancode
				zpaExam {
					module
				}
				planEntry {
					dayNumber
					slotNumber
				}
				plannedRooms {
					room {
						name
					}
					studentsInRoom
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Prüfungen, bei denen Studierende ohne Raum sind („No Room") → große Warnung.
	const noRoomExams = (data.plannedExams ?? [])
		.map((/** @type {any} */ e) => {
			const noRoom = (e.plannedRooms ?? []).find(
				(/** @type {any} */ pr) => pr.room?.name === 'No Room'
			);
			const students = noRoom ? (noRoom.studentsInRoom ?? []).length : 0;
			return students > 0
				? {
						ancode: e.ancode,
						module: e.zpaExam.module,
						day: e.planEntry?.dayNumber ?? null,
						slot: e.planEntry?.slotNumber ?? null,
						students
					}
				: null;
		})
		.filter(Boolean)
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.day - b.day || a.slot - b.slot);

	// Set für die „nach Räumen"-Übersicht: welcher Raum ist in welchem day-slot
	// geplant. (devalue serialisiert Sets über die SvelteKit-Grenze.)
	const plannedRooms = new Set(
		(data.plannedRooms ?? []).map((/** @type {any} */ r) => `${r.day}-${r.slot}-${r.room.name}`)
	);

	return {
		semesterConfig: data.semesterConfig,
		plannedRoomNames: data.plannedRoomNames,
		plannedRooms,
		noRoomExams
	};
}
