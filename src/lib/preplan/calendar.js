// Reine Helfer für den Preplan-Kalender (Zeitachse). View-frei und unit-getestet;
// die Svelte-Darstellung liegt in PreplanCalendar.svelte.

// Kategoriale Raum-Palette — identisch zu /rooms/annyBookings, damit dieselbe
// Prüfung/dasselbe Semester überall dieselbe Raum-Farbe bekommt.
export const ROOM_PALETTE = [
	'#60a5fa',
	'#f87171',
	'#34d399',
	'#fbbf24',
	'#a78bfa',
	'#f472b6',
	'#22d3ee',
	'#fb923c',
	'#4ade80',
	'#e879f9',
	'#2dd4bf',
	'#facc15'
];

// Standardwerte, wenn am Backend nichts gesetzt ist (Vor-/Nachlauf: „ersetzt den
// Default 15"; Dauer kann null sein → Annahme für die Darstellung).
export const PRE_DEFAULT = 15;
export const POST_DEFAULT = 15;
export const DURATION_DEFAULT = 90;

// Feste Reihenfolge der T-Bau-Prüfungsräume: die vier „normalen" Räume zuerst,
// T3.021 ist ein Nachteilsausgleichsraum (eine Person) und kommt zuletzt.
// Übrige Räume alphabetisch dahinter.
export const ROOM_PRIORITY = ['T3.015', 'T3.016', 'T3.017', 'T3.023', 'T3.021'];

/**
 * Räume in fester Anzeige-Reihenfolge (ROOM_PRIORITY zuerst, Rest alphabetisch).
 * Dedupliziert. @param {(string | null | undefined)[]} rooms
 * @returns {string[]}
 */
export function roomOrder(rooms) {
	const uniq = /** @type {string[]} */ ([...new Set((rooms ?? []).filter(Boolean))]);
	return uniq.sort((a, b) => {
		const ia = ROOM_PRIORITY.indexOf(a);
		const ib = ROOM_PRIORITY.indexOf(b);
		if (ia !== -1 || ib !== -1) {
			if (ia === -1) return 1;
			if (ib === -1) return -1;
			return ia - ib;
		}
		return a.localeCompare(b);
	});
}

/**
 * Raum → Farbe. In fester Raum-Reihenfolge (roomOrder) in die Palette indiziert;
 * beide Seiten (Preplan-Kalender, annyBookings) nutzen dieselbe Zuordnung.
 * @param {(string | null | undefined)[]} rooms
 * @returns {Record<string, string>}
 */
export function roomColorMap(rooms) {
	/** @type {Record<string, string>} */
	const map = {};
	roomOrder(rooms).forEach((r, i) => (map[r] = ROOM_PALETTE[i % ROOM_PALETTE.length]));
	return map;
}

/** Minuten seit Mitternacht aus „YYYY-MM-DDTHH:MM…". @param {string | null | undefined} iso */
export function minutesOfIso(iso) {
	const m = /T(\d{2}):(\d{2})/.exec(String(iso ?? ''));
	return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Datums-Key „YYYY-MM-DD" aus einer ISO-Zeit. @param {string | null | undefined} iso */
export function dateKeyOfIso(iso) {
	const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(iso ?? ''));
	return m ? m[1] : null;
}

/** „min → HH:MM". @param {number} min */
export function hhmm(min) {
	return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Zeichenbare Prüfungs-Blöcke: pro eingeplanter Pre-Prüfung ein Fenster mit
 * Vorlauf/Nachlauf. Nicht eingeplante (ohne plannedStarttime) fallen raus.
 * @param {any[]} exams
 */
export function examBlocks(exams) {
	const out = [];
	for (const e of exams ?? []) {
		const start = minutesOfIso(e.plannedStarttime);
		const dateKey = dateKeyOfIso(e.plannedStarttime);
		if (start == null || dateKey == null) continue;
		const rc = e.constraints?.roomConstraints ?? {};
		const durKnown = e.duration != null;
		const dur = durKnown ? e.duration : DURATION_DEFAULT;
		const pre = rc.preExamMinutes ?? PRE_DEFAULT;
		const post = rc.postExamMinutes ?? POST_DEFAULT;
		out.push({
			id: e.id,
			dateKey,
			pre,
			post,
			dur,
			durKnown,
			winStart: start - pre,
			examStart: start,
			examEnd: start + dur,
			winEnd: start + dur + post,
			examKind: e.examKind,
			module: e.module,
			expectedStudents: e.expectedStudents,
			programs: e.programs ?? [],
			examerName: e.examerName,
			isFixed: e.isFixed,
			allowedRooms: rc.allowedRooms ?? []
		});
	}
	return out;
}

/**
 * Überlappungsfrei in „Spuren" (lanes) packen; jedes Item braucht numerische
 * start/end-Minuten. Rückgabe: platzierte Items (mit `lane`) + Gesamt-Lanezahl.
 * @template {{ start: number, end: number }} T
 * @param {T[]} items
 * @returns {{ placed: (T & { lane: number })[], lanes: number }}
 */
export function packLanes(items) {
	const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
	/** @type {number[]} */
	const laneEnds = [];
	const placed = sorted.map((it) => {
		let lane = laneEnds.findIndex((end) => end <= it.start);
		if (lane === -1) {
			lane = laneEnds.length;
			laneEnds.push(it.end);
		} else {
			laneEnds[lane] = it.end;
		}
		return { ...it, lane };
	});
	return { placed, lanes: Math.max(1, laneEnds.length) };
}

/**
 * Wie packLanes, aber die Breite jedes Items ist sein Kapazitätsanteil (`frac`,
 * 0..1 = Anteil der verfügbaren Raumplätze) statt einer gleich breiten Spur.
 * Zeitlich überlappende Items werden greedy horizontal nebeneinander gestapelt;
 * die freie Restbreite (bis 1) zeigt die ungenutzte Kapazität. `minFrac` ist eine
 * Mindestbreite, damit auch kleine Prüfungen noch beschriftbar bleiben.
 * @template {{ start: number, end: number, frac?: number }} T
 * @param {T[]} items
 * @param {number} [minFrac]
 * @returns {(T & { left: number, width: number })[]}
 */
export function packByCapacity(items, minFrac = 0.08) {
	const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
	/** @type {(T & { left: number, width: number })[]} */
	const placed = [];
	for (const it of sorted) {
		const width = Math.min(Math.max(it.frac || 0, minFrac), 1);
		const overlapping = placed.filter((p) => p.start < it.end && p.end > it.start);
		// Kandidaten-Offsets: ganz links + rechte Kanten aller zeitlich überlappenden
		// Blöcke. Der größte davon liegt garantiert kollisionsfrei rechts von allen.
		const candidates = [0, ...overlapping.map((p) => p.left + p.width)].sort((a, b) => a - b);
		let left = candidates[candidates.length - 1];
		for (const c of candidates) {
			const clashes = overlapping.some(
				(p) => c < p.left + p.width - 1e-9 && c + width > p.left + 1e-9
			);
			if (!clashes) {
				left = c;
				break;
			}
		}
		placed.push({ ...it, left, width });
	}
	return placed;
}

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** @param {string} dateKey → UTC-Date */
export function parseKey(dateKey) {
	const [y, m, d] = String(dateKey).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}
/** @param {Date} dt → „YYYY-MM-DD" */
export function fmtKey(dt) {
	return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
		dt.getUTCDate()
	).padStart(2, '0')}`;
}
/** @param {string} dateKey → „Mo 13.07." */
export function dayLabel(dateKey) {
	const dt = parseKey(dateKey);
	if (Number.isNaN(dt.getTime())) return dateKey;
	return `${WD[dt.getUTCDay()]} ${String(dt.getUTCDate()).padStart(2, '0')}.${String(
		dt.getUTCMonth() + 1
	).padStart(2, '0')}.`;
}
/** @param {string} dateKey → Montag derselben Kalenderwoche (als dateKey) */
export function mondayKeyOf(dateKey) {
	const dt = parseKey(dateKey);
	const dow = dt.getUTCDay();
	const diff = dow === 0 ? -6 : 1 - dow;
	dt.setUTCDate(dt.getUTCDate() + diff);
	return fmtKey(dt);
}

/**
 * Datums-Keys in Wochen (immer Mo–Fr, Wochenend-Tage mit Inhalt angehängt)
 * gruppieren. @param {(string | null | undefined)[]} dateKeys
 */
export function weekGroups(dateKeys) {
	/** @type {Map<string, Set<string>>} */
	const byMonday = new Map();
	for (const dk of new Set((dateKeys ?? []).filter(Boolean))) {
		const mk = mondayKeyOf(/** @type {string} */ (dk));
		if (!byMonday.has(mk)) byMonday.set(mk, new Set());
		byMonday.get(mk)?.add(/** @type {string} */ (dk));
	}
	return [...byMonday.keys()].sort().map((mk) => {
		const present = byMonday.get(mk) ?? new Set();
		const monday = parseKey(mk);
		/** @type {Set<string>} */
		const seen = new Set();
		/** @type {{ dateKey: string, label: string }[]} */
		const days = [];
		for (let i = 0; i < 5; i += 1) {
			const dt = new Date(
				Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i)
			);
			const dk = fmtKey(dt);
			seen.add(dk);
			days.push({ dateKey: dk, label: dayLabel(dk) });
		}
		for (const dk of [...present].sort())
			if (!seen.has(dk)) days.push({ dateKey: dk, label: dayLabel(dk) });
		days.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
		const friday = fmtKey(
			new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 4))
		);
		return { monday: mk, rangeLabel: `${dayLabel(mk)} – ${dayLabel(friday)}`, days };
	});
}

/**
 * Gemeinsame Zeitachse (auf volle Stunden gerundet, min. 2 h) über alle Fenster.
 * @param {{ start: number | null, end: number | null }[]} windows
 * @param {{ min?: number, max?: number }} [fallback]
 */
export function timeRange(windows, { min = 8 * 60, max = 18 * 60 } = {}) {
	let lo = Infinity;
	let hi = -Infinity;
	for (const w of windows ?? []) {
		if (w.start == null || w.end == null) continue;
		lo = Math.min(lo, w.start);
		hi = Math.max(hi, w.end);
	}
	if (!Number.isFinite(lo)) {
		lo = min;
		hi = max;
	}
	lo = Math.floor(lo / 60) * 60;
	hi = Math.ceil(hi / 60) * 60;
	if (hi - lo < 120) hi = lo + 120;
	return { lo, hi };
}
