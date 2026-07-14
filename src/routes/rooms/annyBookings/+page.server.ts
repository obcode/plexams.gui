import { backendRequest } from '$lib/server/backend';

const BOOKING_TIMEZONE = 'Europe/Berlin';
const SLOT_DURATION_MINUTES = 120;
const PRIORITY_ROOMS = ['T3.015', 'T3.016', 'T3.017', 'T3.023', 'T3.021'];

type AnnyBooking = {
	number: string;
	startDate: string;
	endDate: string;
	description: string;
	status: string;
	isBlocker: boolean;
	room: string | null;
	note: string;
	canceledAt: string | null;
	personalizationName: string | null;
	mine: boolean;
};

type Interval = {
	start: number;
	end: number;
};

type BookingEntry = {
	booking: AnnyBooking;
	startMinutes: number;
	endMinutes: number;
};

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

function toDateKey(value: string | Date | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	const raw = String(value);
	const localIsoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/);
	if (localIsoMatch) return localIsoMatch[1];
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return null;
	return bookingDateFormatter.format(parsed);
}

function toMinutes(value: string | Date | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const raw = String(value);
	const localIsoMatch = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
	if (localIsoMatch) return Number(localIsoMatch[1]) * 60 + Number(localIsoMatch[2]);
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return null;
	const berlinTime = bookingTimeFormatter.format(parsed);
	const berlinMatch = berlinTime.match(/(\d{2}):(\d{2})/);
	if (!berlinMatch) return null;
	return Number(berlinMatch[1]) * 60 + Number(berlinMatch[2]);
}

function mergeIntervals(intervals: Interval[]): Interval[] {
	if (intervals.length === 0) return [];
	const sorted = [...intervals].sort((a, b) => a.start - b.start);
	const merged: Interval[] = [{ start: sorted[0].start, end: sorted[0].end }];

	for (let i = 1; i < sorted.length; i += 1) {
		const current = sorted[i];
		const last = merged[merged.length - 1];
		if (current.start <= last.end) {
			last.end = Math.max(last.end, current.end);
		} else {
			merged.push({ start: current.start, end: current.end });
		}
	}

	return merged;
}

function coveredSlotNumbers(
	mergedIntervals: Interval[],
	sortedStarttimes: Array<{ number: number; minutes: number }>
): number[] {
	return sortedStarttimes
		.filter((slot) =>
			mergedIntervals.some(
				(interval) =>
					slot.minutes >= interval.start && slot.minutes + SLOT_DURATION_MINUTES <= interval.end
			)
		)
		.map((slot) => slot.number);
}

export async function load() {
	const query = `
		query {
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
				personalizationName
				mine
			}
			annyConfig {
				personalizationNames
			}
			rooms {
				name
				requestWith
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

	const dayMap = new Map<number, string>();
	const dayByDate = new Map<string, number>();
	const starttimeMap = new Map<number, string>();
	const sortedStarttimes: Array<{ number: number; minutes: number }> = [];

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
	sortedStarttimes.sort((a, b) => a.minutes - b.minutes);

	const bookingsByDayRoom = new Map<string, BookingEntry[]>();
	const tRooms = new Set<string>();

	for (const booking of (data.allAnnyBookings || []) as AnnyBooking[]) {
		if (!booking.room || !booking.room.startsWith('T')) continue;
		if (booking.canceledAt) continue;
		const dateKey = toDateKey(booking.startDate);
		if (!dateKey) continue;
		const dayNumber = dayByDate.get(dateKey);
		if (dayNumber === undefined) continue;
		const startMinutes = toMinutes(booking.startDate);
		const endMinutes = toMinutes(booking.endDate);
		if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) continue;

		tRooms.add(booking.room);
		const groupKey = `${dayNumber}|${booking.room}`;
		if (!bookingsByDayRoom.has(groupKey)) bookingsByDayRoom.set(groupKey, []);
		bookingsByDayRoom.get(groupKey)?.push({ booking, startMinutes, endMinutes });
	}

	const slotMap = new Map<
		string,
		{
			day: number;
			slot: number;
			date: string | null;
			start: string | null;
			bookingsByRoom: Record<string, AnnyBooking[]>;
		}
	>();

	// Build all configured semester slots upfront so the UI can optionally show empty slots as well.
	for (const [day, date] of dayMap.entries()) {
		for (const { number: slot } of sortedStarttimes) {
			slotMap.set(`${day}-${slot}`, {
				day,
				slot,
				date,
				start: starttimeMap.get(slot) ?? null,
				bookingsByRoom: {}
			});
		}
	}

	for (const [groupKey, entries] of bookingsByDayRoom.entries()) {
		const [dayStr, room] = groupKey.split('|');
		const day = Number(dayStr);
		if (!Number.isFinite(day)) continue;

		const merged = mergeIntervals(
			entries.map((entry) => ({ start: entry.startMinutes, end: entry.endMinutes }))
		);
		const slots = coveredSlotNumbers(merged, sortedStarttimes);

		for (const slot of slots) {
			const slotStartMinutes = sortedStarttimes.find((s) => s.number === slot)?.minutes;
			if (slotStartMinutes === undefined) continue;
			const slotEndMinutes = slotStartMinutes + SLOT_DURATION_MINUTES;
			const slotKey = `${day}-${slot}`;

			const slotEntry = slotMap.get(slotKey);
			if (!slotEntry) continue;
			if (!slotEntry.bookingsByRoom[room]) slotEntry.bookingsByRoom[room] = [];

			const overlapping = entries.filter(
				(entry) => entry.startMinutes < slotEndMinutes && entry.endMinutes > slotStartMinutes
			);

			for (const entry of overlapping) {
				if (
					slotEntry.bookingsByRoom[room].some(
						(existing) =>
							existing.number === entry.booking.number &&
							existing.startDate === entry.booking.startDate &&
							existing.endDate === entry.booking.endDate
					)
				) {
					continue;
				}
				slotEntry.bookingsByRoom[room].push(entry.booking);
			}
		}
	}

	const discoveredRooms = Array.from(tRooms).sort((a, b) => a.localeCompare(b));
	const roomOrder = [
		...PRIORITY_ROOMS.filter((room) => discoveredRooms.includes(room)),
		...discoveredRooms.filter((room) => !PRIORITY_ROOMS.includes(room))
	];

	const slots = Array.from(slotMap.values())
		.map((slot) => {
			for (const room of Object.keys(slot.bookingsByRoom)) {
				slot.bookingsByRoom[room].sort((a, b) => a.startDate.localeCompare(b.startDate));
			}
			const coveredRooms = roomOrder.filter(
				(room) => (slot.bookingsByRoom[room] || []).length > 0
			).length;
			return {
				...slot,
				coveredRooms
			};
		})
		.sort((a, b) => (a.day === b.day ? a.slot - b.slot : a.day - b.day));

	// Alle (nicht stornierten) Buchungen als flache Liste für die „wer wann was"-
	// Ansicht — über alle Räume und Personen, nach Startzeit sortiert.
	const bookings = ((data.allAnnyBookings || []) as AnnyBooking[])
		.filter((b) => !b.canceledAt)
		.map((b) => ({
			number: b.number,
			room: b.room,
			personalizationName: b.personalizationName,
			startDate: b.startDate,
			endDate: b.endDate,
			description: b.description,
			status: b.status,
			isBlocker: b.isBlocker,
			note: b.note,
			mine: !!b.mine,
			// Vorberechnet für die Kalenderansicht (Berlin-Zeit).
			dateKey: toDateKey(b.startDate),
			startMin: toMinutes(b.startDate),
			endMin: toMinutes(b.endDate)
		}))
		.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));

	// Prüfungszeitraum = konfigurierte Prüfungstage (sortiert nach Datum).
	const examDays = Array.from(dayMap.entries())
		.map(([dayNumber, date]) => ({ dayNumber, date: String(date || '').slice(0, 10) }))
		.filter((d) => d.date)
		.sort((a, b) => a.date.localeCompare(b.date));

	const personalizationNames: string[] = data.annyConfig?.personalizationNames || [];
	const annyRooms: string[] = ((data.rooms || []) as Array<{ name: string; requestWith: string }>)
		.filter((r) => r.requestWith === 'ANNY')
		.map((r) => r.name)
		.sort((a, b) => a.localeCompare(b));

	return {
		slots,
		roomOrder,
		bookings,
		examDays,
		personalizationNames,
		annyRooms
	};
}
