import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				preplanExams {
					id
					examKind
					examerID
					examerName
					module
					programs
					expectedStudents
					duration
					plannedDayNumber
					plannedSlotNumber
					ancode
					notes
					constraints {
						notPlannedByMe
						doNotPublish
						online
						fixedDay
						fixedTime
						excludeDays
						possibleDays
						sameSlot
						roomConstraints {
							allowedRooms
							exahm
							seb
							lab
							placesWithSocket
							kdpJiraURL
							maxStudents
							additionalSeats
							comments
						}
					}
				}
				teachers(fromZPA: false) {
					id
					fullname
				}
				zpaExams {
					ancode
				}
				studyPrograms {
					shortname
					name
					category
				}
				semesterConfig {
					slots {
						dayNumber
						slotNumber
						starttime
					}
					mucDaiSlots {
						dayNumber
						slotNumber
						starttime
					}
				}
				preplanOverview {
					slots {
						dayNumber
						slotNumber
						starttime
						exahm {
							examCount
							seatsNeeded
							roomsSuggested
							rooms
							seatsAvailable
							seatsBooked
							roomsToBook
						}
						seb {
							examCount
							seatsNeeded
							roomsSuggested
							rooms
							seatsAvailable
							seatsBooked
							roomsToBook
						}
						conflicts {
							program
							preplanExamIDs
							modules
						}
					}
				}
				allAnnyBookings {
					room
					startDate
					endDate
					canceledAt
				}
			}
		`
	);

	const teachers = (data.teachers ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.fullname.localeCompare(b.fullname));

	// gültige Slots = slots ∪ mucDaiSlots (dedupliziert, sortiert)
	/** @type {Map<string, any>} */
	const slotMap = new Map();
	for (const s of [
		...(data.semesterConfig?.slots ?? []),
		...(data.semesterConfig?.mucDaiSlots ?? [])
	]) {
		slotMap.set(`${s.dayNumber}-${s.slotNumber}`, s);
	}
	const slots = [...slotMap.values()].sort(
		(/** @type {any} */ a, /** @type {any} */ b) =>
			a.dayNumber - b.dayNumber || a.slotNumber - b.slotNumber
	);

	// --- Anny-Buchungen je Slot (für „gebucht/ungenutzt" im Kalender) ---
	// gleiche Berlin-Zeit-Logik wie /plan/annyBookings.
	const SLOT_DURATION_MINUTES = 120;
	const dateFmt = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Europe/Berlin',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	const timeFmt = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/Berlin',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	/** @param {string | null | undefined} value */
	function toDateKey(value) {
		if (value == null) return null;
		const raw = String(value);
		const m = raw.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}/);
		if (m) return m[1];
		const d = new Date(raw);
		return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
	}
	/** @param {string | null | undefined} value */
	function toMinutes(value) {
		if (value == null) return null;
		const raw = String(value);
		const m = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
		if (m) return Number(m[1]) * 60 + Number(m[2]);
		const d = new Date(raw);
		if (Number.isNaN(d.getTime())) return null;
		const t = timeFmt.format(d).match(/(\d{2}):(\d{2})/);
		return t ? Number(t[1]) * 60 + Number(t[2]) : null;
	}

	/** @type {Map<string, {start:number,end:number}[]>} */
	const annyByDayRoom = new Map();
	for (const b of data.allAnnyBookings ?? []) {
		if (!b.room || !String(b.room).startsWith('T') || b.canceledAt) continue;
		const dk = toDateKey(b.startDate);
		const s = toMinutes(b.startDate);
		const e = toMinutes(b.endDate);
		if (dk == null || s == null || e == null || e <= s) continue;
		const key = `${dk}|${b.room}`;
		if (!annyByDayRoom.has(key)) annyByDayRoom.set(key, []);
		annyByDayRoom.get(key)?.push({ start: s, end: e });
	}
	/** Räume mit Anny-Buchung, die das Slot-Fenster überlappen. @param {any} starttime */
	function bookedRoomsForSlot(starttime) {
		const dk = toDateKey(starttime);
		const ss = toMinutes(starttime);
		if (dk == null || ss == null) return [];
		const se = ss + SLOT_DURATION_MINUTES;
		/** @type {string[]} */
		const rooms = [];
		for (const [key, ivs] of annyByDayRoom) {
			const [d, room] = key.split('|');
			if (d !== dk) continue;
			if (ivs.some((iv) => iv.start < se && iv.end > ss)) rooms.push(room);
		}
		return rooms.sort((a, b) => a.localeCompare(b));
	}

	// Übersicht: „ohne Slot"-Eimer (dayNumber == null) zuerst, dann nach Tag/Slot.
	const overview = (data.preplanOverview?.slots ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => {
			if (a.dayNumber == null) return -1;
			if (b.dayNumber == null) return 1;
			return a.dayNumber - b.dayNumber || a.slotNumber - b.slotNumber;
		})
		.map((/** @type {any} */ s) => ({
			...s,
			bookedRooms: s.dayNumber == null ? [] : bookedRoomsForSlot(s.starttime)
		}));

	return {
		exams: data.preplanExams ?? [],
		teachers,
		studyPrograms: data.studyPrograms ?? [],
		slots,
		overview,
		// ZPA-Prüfungsliste importiert? → dann unverbundene Ancodes hervorheben
		zpaPresent: (data.zpaExams ?? []).length > 0
	};
}
