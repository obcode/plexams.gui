import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const query = gql`
		query {
			roomsForSlots {
				day
				slot
				rooms {
					name
					seats
				}
			}
			rooms {
				name
				seats
			}
			plannedExams {
				ancode
				studentRegsCount
				planEntry {
					dayNumber
					slotNumber
				}
				zpaExam {
					module
				}
				constraints {
					roomConstraints {
						exahm
						seb
					}
				}
				plannedRooms {
					prePlanned
					reserve
					room {
						name
						seats
					}
				}
			}
			prePlannedRooms {
				ancode
				roomName
				reserve
			}
			semesterConfig {
				days { number date }
				starttimes { number start }
			}
		}

	`;
	const data = await request(env.PLEXAMS_SERVER, query);

	// Build slot map
	const slotMap = new Map();

	// Build room seat map (all rooms)
	const roomSeatMap = new Map();
	for (const r of data.rooms) roomSeatMap.set(r.name, r.seats);

	// Initialize with T rooms availability per slot
	for (const rs of data.roomsForSlots) {
		const key = `${rs.day}-${rs.slot}`;
		const tRooms = rs.rooms
			.filter((r) => r.name.startsWith('T'))
			.map((r) => ({ name: r.name, seats: r.seats }));
		if (!slotMap.has(key)) slotMap.set(key, { day: rs.day, slot: rs.slot, tRooms, exams: [] });
		else slotMap.get(key).tRooms = tRooms;
	}

	// Index prePlanned rooms by ancode
	const prePlannedByAncode = new Map();
	for (const ppr of data.prePlannedRooms) {
		if (!prePlannedByAncode.has(ppr.ancode)) prePlannedByAncode.set(ppr.ancode, []);
		prePlannedByAncode.get(ppr.ancode).push({
			name: ppr.roomName,
			seats: roomSeatMap.get(ppr.roomName) ?? null,
			prePlanned: true,
			reserve: ppr.reserve
		});
	}

	// Add exams needing EXaHM or SEB rooms (show planned or preplanned rooms)
	for (const exam of data.plannedExams) {
		const wantsExahm = exam.constraints?.roomConstraints?.exahm;
		const wantsSeb = exam.constraints?.roomConstraints?.seb;
		if (!wantsExahm && !wantsSeb) continue;
		const pe = exam.planEntry;
		// If exam not yet in a slot, still list under day/slot = -1/-1 to surface reserved rooms
		const dayNumber = pe?.dayNumber ?? -1;
		const slotNumber = pe?.slotNumber ?? -1;
		const key = `${dayNumber}-${slotNumber}`;
		if (!slotMap.has(key)) {
			slotMap.set(key, { day: dayNumber, slot: slotNumber, tRooms: [], exams: [] });
		}
		// Collect plannedRooms from exam OR fallback to prePlannedByAncode
		let plannedRooms = [];
		if (exam.plannedRooms && exam.plannedRooms.length > 0) {
			plannedRooms = exam.plannedRooms.map((pr) => ({
				name: pr.room?.name,
				seats: pr.room?.seats,
				prePlanned: pr.prePlanned,
				reserve: pr.reserve
			}));
		}
		if (plannedRooms.length === 0 && prePlannedByAncode.has(exam.ancode)) {
			plannedRooms = prePlannedByAncode.get(exam.ancode);
		}
		slotMap.get(key).exams.push({
			ancode: exam.ancode,
			module: exam.zpaExam.module,
			studentRegsCount: exam.studentRegsCount,
			wantsExahm,
			wantsSeb,
			plannedRooms
		});
	}

	// Convert semester config to maps for quick lookup
	const dayMap = new Map();
	const starttimeMap = new Map();
	if (data.semesterConfig) {
		for (const d of data.semesterConfig.days || []) dayMap.set(d.number, d.date);
		for (const s of data.semesterConfig.starttimes || []) starttimeMap.set(s.number, s.start);
	}

	// Convert to array and attach date/starttime, then sort
	const slots = Array.from(slotMap.values()).map((s) => {
		const date = s.day >= 0 ? dayMap.get(s.day) ?? null : null;
		const start = s.slot >= 0 ? starttimeMap.get(s.slot) ?? null : null;
		return { ...s, date, start };
	});

	slots.sort((a, b) => (a.day === b.day ? a.slot - b.slot : a.day - b.day));

	return { slots };
}
