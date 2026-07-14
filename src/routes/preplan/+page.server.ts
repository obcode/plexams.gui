import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';
import { GENERATION_CONFIG_FIELDS } from '$lib/semester/generationConfig';
import type { PageServerLoad } from './$types';

// Die Kalender-Übersicht (preplanOverview) und alle Anny-Buchungen sind die teuren
// Teile der Seite. Sie speisen nur den Kalender weiter unten — die Prüfungstabelle,
// Regeln und Bedien-Elemente brauchen sie nicht. Deshalb: Kern-Query awaiten (Seite
// rendert sofort), Kalender-Query als gestreamtes Promise nachliefern (`{#await}`).

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
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
					plannedStarttime
					isFixed
					notSameSlot
					canShareSlot
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
							preExamMinutes
							postExamMinutes
						}
					}
				}
				teachers(fromZPA: true) {
					id
					shortname
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
					days {
						date
					}
					starttimes {
						start
					}
					slots {
						starttime
					}
					mucDaiSlots {
						starttime
					}
				}
				preplanSameSlotGroups {
					complete
					members {
						id
						module
						examKind
						connected
						ancode
					}
				}
				generationConfig {
					${GENERATION_CONFIG_FIELDS}
				}
				preplanConstraints {
					kind
					title
					description
				}
			}
		`);

	const teachers = (data.teachers ?? [])
		.slice()
		.sort((a: any, b: any) => a.shortname.localeCompare(b.shortname));

	// Prüfungszeitraum = konfigurierte Prüfungstage (z. B. 2026 SS: 13.–24.07.).
	const dayKey = (v: string | null | undefined) =>
		(String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] ?? null;
	const examDates = new Set<string>(
		(data.semesterConfig?.days ?? []).map((d: any) => dayKey(d.date)).filter(Boolean)
	);

	// Zeitbasiert: Slot hat nur noch starttime; Tag/Slot lokal ableiten (für Keys/Sort).
	const cfgDaysNum = data.semesterConfig?.days ?? [];
	const cfgStarts = data.semesterConfig?.starttimes ?? [];
	const dn = (st: string) => dayNumberForTime(st, cfgDaysNum);
	const sn = (st: string) => slotNumberForTime(st, cfgStarts);

	// gültige Slots = slots ∪ mucDaiSlots (dedupliziert, sortiert) — nur innerhalb
	// der Prüfungszeit (Datum aus starttime muss ein konfigurierter Prüfungstag sein).
	const slotMap = new Map<string, any>();
	for (const s of [
		...(data.semesterConfig?.slots ?? []),
		...(data.semesterConfig?.mucDaiSlots ?? [])
	]) {
		const dk = dayKey(s.starttime);
		if (examDates.size && dk && !examDates.has(dk)) continue;
		const dayNumber = dn(s.starttime);
		const slotNumber = sn(s.starttime);
		slotMap.set(`${dayNumber}-${slotNumber}`, { ...s, dayNumber, slotNumber });
	}
	const slots = [...slotMap.values()].sort(
		(a: any, b: any) => a.dayNumber - b.dayNumber || a.slotNumber - b.slotNumber
	);

	// --- Kalender-Daten: teure Zweit-Query, als Promise gestreamt (nicht awaiten) ---
	// preplanOverview (Server rechnet je Slot Sitz-Bedarf) + allAnnyBookings sind die
	// langsamen Teile; sie speisen nur den Kalender. Die Post-Verarbeitung (Anny-Balken,
	// belegte Räume je Slot, Kalender-Slots) hängt an slots/examDates/dn/sn aus dem Kern.
	async function loadCalendar() {
		const cal = await backendRequest(gql`
			query {
				preplanOverview {
					slots {
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
					mine
				}
			}
		`);

		// --- Anny-Buchungen je Slot (für „gebucht/ungenutzt" im Kalender) ---
		// gleiche Berlin-Zeit-Logik wie /rooms/annyBookings.
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
		function toDateKey(value: string | null | undefined) {
			if (value == null) return null;
			const raw = String(value);
			const m = raw.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}/);
			if (m) return m[1];
			const d = new Date(raw);
			return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
		}
		function toMinutes(value: string | null | undefined) {
			if (value == null) return null;
			const raw = String(value);
			const m = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
			if (m) return Number(m[1]) * 60 + Number(m[2]);
			const d = new Date(raw);
			if (Number.isNaN(d.getTime())) return null;
			const t = timeFmt.format(d).match(/(\d{2}):(\d{2})/);
			return t ? Number(t[1]) * 60 + Number(t[2]) : null;
		}

		// zusammenhängende Intervalle mergen (zwei aneinandergrenzende Buchungen
		// desselben Raums = ein Balken).
		function mergeIntervals(ivs: { start: number; end: number }[]) {
			const sorted = [...ivs].sort((a, b) => a.start - b.start);
			const out: { start: number; end: number }[] = [];
			for (const iv of sorted) {
				const last = out[out.length - 1];
				if (last && iv.start <= last.end) last.end = Math.max(last.end, iv.end);
				else out.push({ ...iv });
			}
			return out;
		}

		const annyByDayRoom = new Map<string, { start: number; end: number }[]>();
		for (const b of cal.allAnnyBookings ?? []) {
			// nur eigene Buchungen (mine) zählen — fremde Anny-Buchungen sind nicht „unsere"
			// gebuchten Räume (entspricht der seatsBooked-Logik des Servers).
			if (!b.mine || !b.room || !String(b.room).startsWith('T') || b.canceledAt) continue;
			const dk = toDateKey(b.startDate);
			const s = toMinutes(b.startDate);
			const e = toMinutes(b.endDate);
			if (dk == null || s == null || e == null || e <= s) continue;
			const key = `${dk}|${b.room}`;
			if (!annyByDayRoom.has(key)) annyByDayRoom.set(key, []);
			annyByDayRoom.get(key)?.push({ start: s, end: e });
		}
		// Räume mit Anny-Buchung, die das Slot-Fenster überlappen.
		function bookedRoomsForSlot(starttime: any) {
			const dk = toDateKey(starttime);
			const ss = toMinutes(starttime);
			if (dk == null || ss == null) return [];
			const se = ss + SLOT_DURATION_MINUTES;
			const rooms: string[] = [];
			for (const [key, ivs] of annyByDayRoom) {
				const [d, room] = key.split('|');
				if (d !== dk) continue;
				if (ivs.some((iv) => iv.start < se && iv.end > ss)) rooms.push(room);
			}
			return rooms.sort((a, b) => a.localeCompare(b));
		}

		// Übersicht: „ohne Slot"-Eimer (starttime == null) zuerst, dann nach Tag/Slot.
		// PreplanSlotNeed liefert nur noch starttime → Tag/Slot lokal ableiten.
		const overview = (cal.preplanOverview?.slots ?? [])
			.slice()
			.map((s: any) => ({
				...s,
				dayNumber: s.starttime ? dn(s.starttime) : null,
				slotNumber: s.starttime ? sn(s.starttime) : null
			}))
			.sort((a: any, b: any) => {
				if (a.dayNumber == null) return -1;
				if (b.dayNumber == null) return 1;
				return a.dayNumber - b.dayNumber || a.slotNumber - b.slotNumber;
			});

		// --- Kalender-Slots: alle Slot-Zeiten mit Prüfung ODER gebuchten Räumen ---
		// Genutzte Räume eines Slots = decken einen Bedarf (rooms \ roomsToBook).
		function usedRoomsOf(ov: any) {
			const set = new Set<string>();
			for (const need of [ov?.exahm, ov?.seb]) {
				for (const r of need?.rooms || []) if (!(need?.roomsToBook || []).includes(r)) set.add(r);
			}
			return set;
		}
		const overviewByKey = new Map<string, any>(
			overview
				.filter((s: any) => s.dayNumber != null)
				.map((s: any) => [`${s.dayNumber}-${s.slotNumber}`, s])
		);
		const emptyNeed = {
			examCount: 0,
			seatsNeeded: 0,
			roomsSuggested: 0,
			rooms: [],
			seatsAvailable: 0,
			seatsBooked: 0,
			roomsToBook: []
		};
		const calendarSlots = [];
		for (const cs of slots) {
			const ov = overviewByKey.get(`${cs.dayNumber}-${cs.slotNumber}`);
			const booked = bookedRoomsForSlot(cs.starttime);
			const used = ov ? usedRoomsOf(ov) : new Set<string>();
			const freeRooms = booked.filter((r: string) => !used.has(r));
			const hasExam = !!ov && ((ov.exahm?.examCount || 0) > 0 || (ov.seb?.examCount || 0) > 0);
			if (!hasExam && freeRooms.length === 0) continue;
			calendarSlots.push({
				dayNumber: cs.dayNumber,
				slotNumber: cs.slotNumber,
				starttime: cs.starttime,
				exahm: ov?.exahm ?? emptyNeed,
				seb: ov?.seb ?? emptyNeed,
				conflicts: ov?.conflicts ?? [],
				bookedRooms: booked,
				freeRooms
			});
		}

		// --- Zeichenbare Anny-Balken für den Zeitachsen-Kalender ---
		// eigene, nicht stornierte T-Raum-Buchungen innerhalb des Prüfungszeitraums,
		// pro Tag+Raum zu Balken gemergt (gleiche mine-Logik wie seatsBooked).
		const annyBars: { dateKey: string; room: string; startMin: number; endMin: number }[] = [];
		for (const [key, ivs] of annyByDayRoom) {
			const [dk, room] = key.split('|');
			if (examDates.size && !examDates.has(dk)) continue;
			for (const iv of mergeIntervals(ivs))
				annyBars.push({ dateKey: dk, room, startMin: iv.start, endMin: iv.end });
		}
		annyBars.sort(
			(a, b) =>
				a.dateKey.localeCompare(b.dateKey) ||
				a.startMin - b.startMin ||
				a.room.localeCompare(b.room)
		);

		// Raum-Menge für das Farb-Mapping — aus ALLEN (nicht stornierten) Buchungen,
		// damit die Raum-Farben exakt denen von /rooms/annyBookings entsprechen.
		const bookingRooms = [
			...new Set(
				(cal.allAnnyBookings ?? [])
					.filter((b: any) => !b.canceledAt && b.room)
					.map((b: any) => b.room as string)
			)
		].sort((a, b) => String(a).localeCompare(String(b)));

		return { calendarSlots, annyBars, bookingRooms };
	}

	return {
		exams: data.preplanExams ?? [],
		teachers,
		studyPrograms: data.studyPrograms ?? [],
		slots,
		sameSlotGroups: data.preplanSameSlotGroups ?? [],
		// ZPA-Prüfungsliste importiert? → dann unverbundene Ancodes hervorheben
		zpaPresent: (data.zpaExams ?? []).length > 0,
		// Pre-Plan-Solver-Parameter (Teil der globalen generationConfig)
		generationConfig: data.generationConfig ?? null,
		// Read-only Solver-Regeln (kommen komplett vom Backend, bleiben synchron zum Solver)
		hardRules: (data.preplanConstraints ?? []).filter((r: any) => r.kind === 'HARD'),
		softRules: (data.preplanConstraints ?? []).filter((r: any) => r.kind === 'SOFT'),
		// Teure Kalender-Daten gestreamt nachliefern → Seite rendert sofort, Kalender folgt.
		calendar: loadCalendar()
	};
};
