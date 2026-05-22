import { env } from '$env/dynamic/private';
import { request } from 'graphql-request';

const BOOKING_TIMEZONE = 'Europe/Berlin';
const bookingDateFormatter = new Intl.DateTimeFormat('sv-SE', {
	timeZone: BOOKING_TIMEZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const bookingTimeFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: BOOKING_TIMEZONE,
	hour: '2-digit',
	minute: '2-digit',
	hour12: false
});

export async function load() {
	const query = `
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
			allAnnyBookings {
				number
				startDate
				endDate
				description
				status
				isBlocker
				room
				note
				canceledAt
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
			.filter((/** @type {{name: string, seats: number}} */ r) => r.name.startsWith('T'))
			.map((/** @type {{name: string, seats: number}} */ r) => ({ name: r.name, seats: r.seats }));
		if (!slotMap.has(key)) {
			slotMap.set(key, { day: rs.day, slot: rs.slot, tRooms, exams: [], annyBookings: [] });
		} else slotMap.get(key).tRooms = tRooms;
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
			slotMap.set(key, {
				day: dayNumber,
				slot: slotNumber,
				tRooms: [],
				exams: [],
				annyBookings: []
			});
		}
		// Collect plannedRooms from exam OR fallback to prePlannedByAncode
		let plannedRooms = [];
		if (exam.plannedRooms && exam.plannedRooms.length > 0) {
			plannedRooms = exam.plannedRooms.map(
				(
					/** @type {{room?: {name?: string, seats?: number}, prePlanned: boolean, reserve: boolean}} */ pr
				) => ({
					name: pr.room?.name,
					seats: pr.room?.seats,
					prePlanned: pr.prePlanned,
					reserve: pr.reserve
				})
			);
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
	const dayByDate = new Map();
	const starttimeMap = new Map();
	const sortedStarttimes = /** @type {{number: number, minutes: number}[]} */ ([]);
	if (data.semesterConfig) {
		for (const d of data.semesterConfig.days || []) {
			dayMap.set(d.number, d.date);
			const dateKey = String(d.date || '').slice(0, 10);
			if (dateKey) dayByDate.set(dateKey, d.number);
		}
		for (const s of data.semesterConfig.starttimes || []) {
			starttimeMap.set(s.number, s.start);
			const timeMatch = String(s.start || '').match(/(\d{2}):(\d{2})/);
			if (!timeMatch) continue;
			sortedStarttimes.push({
				number: s.number,
				minutes: Number(timeMatch[1]) * 60 + Number(timeMatch[2])
			});
		}
	}
	sortedStarttimes.sort((a, b) => a.minutes - b.minutes);

	/** @param {string | Date | null | undefined} value */
	const toDateKey = (value) => {
		if (value === null || value === undefined) return null;
		const raw = String(value);
		const localIsoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/);
		if (localIsoMatch) return localIsoMatch[1];
		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return null;
		return bookingDateFormatter.format(parsed);
	};

	/** @param {string | Date | null | undefined} value */
	const toMinutes = (value) => {
		const raw = String(value || '');
		const localIsoMatch = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
		if (localIsoMatch) return Number(localIsoMatch[1]) * 60 + Number(localIsoMatch[2]);
		if (value === null || value === undefined) return null;
		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return null;
		const berlinTime = bookingTimeFormatter.format(parsed);
		const berlinMatch = berlinTime.match(/(\d{2}):(\d{2})/);
		if (!berlinMatch) return null;
		return Number(berlinMatch[1]) * 60 + Number(berlinMatch[2]);
	};

	/**
	 * Assign a booking only to slots that are fully covered by the booking.
	 * A slot is 2h long from its configured start time.
	 * Example: 08:00-11:30 -> slot 08:30 yes, slot 10:30 no (needs booking until 12:30).
	 * @param {{start: number, end: number}[]} intervals
	 */
	const findSlotNumbersFromIntervals = (intervals) => {
		if (!intervals || intervals.length === 0) return [];
		const SLOT_DURATION_MINUTES = 120;

		// Merge touching/overlapping intervals so consecutive bookings can cover one slot together.
		const merged = /** @type {{start: number, end: number}[]} */ ([]);
		for (const interval of [...intervals].sort((a, b) => a.start - b.start)) {
			if (merged.length === 0) {
				merged.push({ start: interval.start, end: interval.end });
				continue;
			}
			const last = merged[merged.length - 1];
			if (interval.start <= last.end) {
				last.end = Math.max(last.end, interval.end);
			} else {
				merged.push({ start: interval.start, end: interval.end });
			}
		}

		return sortedStarttimes
			.filter((s) =>
				merged.some(
					(interval) =>
						s.minutes >= interval.start && s.minutes + SLOT_DURATION_MINUTES <= interval.end
				)
			)
			.map((s) => s.number);
	};

	const bookingsByDayRoom =
		/** @type {Map<string, {booking: any, startMinutes: number, endMinutes: number}[]>} */ (
			new Map()
		);
	for (const booking of data.allAnnyBookings || []) {
		if (!booking.room || booking.canceledAt) continue;
		const dateKey = toDateKey(booking.startDate);
		if (!dateKey) continue;
		const dayNumber = dayByDate.get(dateKey);
		if (dayNumber === undefined) continue;
		const startMinutes = toMinutes(booking.startDate);
		const endMinutes = toMinutes(booking.endDate);
		if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) continue;
		const key = `${dayNumber}|${booking.room}`;
		if (!bookingsByDayRoom.has(key)) bookingsByDayRoom.set(key, []);
		const entries = bookingsByDayRoom.get(key);
		if (!entries) continue;
		entries.push({
			booking,
			startMinutes,
			endMinutes
		});
	}

	for (const [dayRoomKey, entries] of bookingsByDayRoom.entries()) {
		const [dayNumberStr] = dayRoomKey.split('|');
		const dayNumber = Number(dayNumberStr);
		if (!Number.isFinite(dayNumber)) continue;

		const slotNumbers = findSlotNumbersFromIntervals(
			entries.map((/** @type {{startMinutes: number, endMinutes: number}} */ e) => ({
				start: e.startMinutes,
				end: e.endMinutes
			}))
		);

		for (const slotNumber of slotNumbers) {
			const slotStart = sortedStarttimes.find((s) => s.number === slotNumber)?.minutes;
			if (slotStart === undefined) continue;
			const slotEnd = slotStart + 120;

			const key = `${dayNumber}-${slotNumber}`;
			if (!slotMap.has(key)) {
				slotMap.set(key, {
					day: dayNumber,
					slot: slotNumber,
					tRooms: [],
					exams: [],
					annyBookings: []
				});
			}

			for (const entry of entries) {
				// Keep the per-slot booking list informative: include bookings that overlap the covered slot.
				if (entry.startMinutes >= slotEnd || entry.endMinutes <= slotStart) continue;
				slotMap.get(key).annyBookings.push({
					number: entry.booking.number,
					room: entry.booking.room,
					description: entry.booking.description,
					startDate: entry.booking.startDate,
					endDate: entry.booking.endDate,
					status: entry.booking.status,
					isBlocker: entry.booking.isBlocker,
					note: entry.booking.note,
					canceledAt: entry.booking.canceledAt
				});
			}
		}
	}

	// Convert to array and attach date/starttime, then sort
	const slots = Array.from(slotMap.values()).map((s) => {
		const date = s.day >= 0 ? (dayMap.get(s.day) ?? null) : null;
		const start = s.slot >= 0 ? (starttimeMap.get(s.slot) ?? null) : null;
		return {
			...s,
			tRooms: s.tRooms ?? [],
			exams: s.exams ?? [],
			annyBookings: s.annyBookings ?? [],
			date,
			start
		};
	});

	slots.sort((a, b) => (a.day === b.day ? a.slot - b.slot : a.day - b.day));

	return { slots };
}
