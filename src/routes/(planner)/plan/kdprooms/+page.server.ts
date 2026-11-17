import { backendRequest } from '$lib/server/backend';
import { dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';
import type { PageServerLoad } from './$types';

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

export const load: PageServerLoad = async () => {
	const query = `
		query {
			roomsForSlots {
				starttime
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
					starttime
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
					date
				}
				starttimes {
					start
				}
			}
		}
	`;
	const data = await backendRequest(query);

	// Backend liefert keine day/slot-Nummern mehr → 1-basierte Position rekonstruieren.
	const cfgDays = (data.semesterConfig?.days ?? []).map((d: any, i: number) => ({
		...d,
		number: i + 1
	}));
	const cfgStarttimes = (data.semesterConfig?.starttimes ?? []).map((s: any, i: number) => ({
		...s,
		number: i + 1
	}));

	// Build slot map
	const slotMap = new Map<string, any>();

	// Build room seat map (all rooms)
	const roomSeatMap = new Map<string, number>();
	for (const r of data.rooms) roomSeatMap.set(r.name, r.seats);

	// Initialize with T rooms availability per slot
	for (const rs of data.roomsForSlots) {
		// RoomsForSlot liefert nur noch starttime; Tag/Slot lokal ableiten (Key wie unten).
		const rsDay = dayNumberForTime(rs.starttime, cfgDays);
		const rsSlot = slotNumberForTime(rs.starttime, cfgStarttimes);
		const key = `${rsDay}-${rsSlot}`;
		const tRooms = rs.rooms
			.filter((r: { name: string; seats: number }) => r.name.startsWith('T'))
			.map((r: { name: string; seats: number }) => ({ name: r.name, seats: r.seats }));
		if (!slotMap.has(key)) {
			slotMap.set(key, { day: rsDay, slot: rsSlot, tRooms, exams: [], annyBookings: [] });
		} else slotMap.get(key).tRooms = tRooms;
	}

	// Index prePlanned rooms by ancode
	const prePlannedByAncode = new Map<number, any[]>();
	for (const ppr of data.prePlannedRooms) {
		if (!prePlannedByAncode.has(ppr.ancode)) prePlannedByAncode.set(ppr.ancode, []);
		prePlannedByAncode.get(ppr.ancode)?.push({
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
		// Zeitbasiert: Tag/Slot aus starttime ableiten. Ohne Zeit (noch nicht verplant)
		// weiter unter day/slot = -1/-1 listen, um reservierte Räume zu zeigen.
		const dayNumber = pe?.starttime ? dayNumberForTime(pe.starttime, cfgDays) : -1;
		const slotNumber = pe?.starttime ? slotNumberForTime(pe.starttime, cfgStarttimes) : -1;
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
		let plannedRooms: any[] = [];
		if (exam.plannedRooms && exam.plannedRooms.length > 0) {
			plannedRooms = exam.plannedRooms.map(
				(pr: {
					room?: { name?: string; seats?: number };
					prePlanned: boolean;
					reserve: boolean;
				}) => ({
					name: pr.room?.name,
					seats: pr.room?.seats,
					prePlanned: pr.prePlanned,
					reserve: pr.reserve
				})
			);
		}
		if (plannedRooms.length === 0 && prePlannedByAncode.has(exam.ancode)) {
			plannedRooms = prePlannedByAncode.get(exam.ancode) ?? [];
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
	const dayMap = new Map<number, string>();
	const dayByDate = new Map<string, number>();
	const starttimeMap = new Map<number, string>();
	const sortedStarttimes: { number: number; minutes: number }[] = [];
	if (data.semesterConfig) {
		for (const d of cfgDays) {
			dayMap.set(d.number, d.date);
			const dateKey = String(d.date || '').slice(0, 10);
			if (dateKey) dayByDate.set(dateKey, d.number);
		}
		for (const s of cfgStarttimes) {
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

	const toDateKey = (value: string | Date | null | undefined) => {
		if (value === null || value === undefined) return null;
		const raw = String(value);
		const localIsoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/);
		if (localIsoMatch) return localIsoMatch[1];
		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return null;
		return bookingDateFormatter.format(parsed);
	};

	const toMinutes = (value: string | Date | null | undefined) => {
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
	 */
	const findSlotNumbersFromIntervals = (intervals: { start: number; end: number }[]) => {
		if (!intervals || intervals.length === 0) return [];
		const SLOT_DURATION_MINUTES = 120;

		// Merge touching/overlapping intervals so consecutive bookings can cover one slot together.
		const merged: { start: number; end: number }[] = [];
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

	const bookingsByDayRoom = new Map<
		string,
		{ booking: any; startMinutes: number; endMinutes: number }[]
	>();
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
			entries.map((e: { startMinutes: number; endMinutes: number }) => ({
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
};
