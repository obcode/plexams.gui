// Reine Datums-/Kalender-Mathematik für die Wochen- und Zeit-Ansichten des
// Prüfungsplans. Bewusst UTC-basiert (die Semester-Tage kommen als „yyyy-mm-dd"
// ohne Zeitzone; wir rechnen kalendarisch, nicht wanduhr-lokal). Aus
// /plan/exams extrahiert, damit die kniffligen ISO-Wochen-Regeln testbar sind.

const MS_PER_WEEK = 604800000;

/** „yyyy-mm-dd…" → UTC-Date (Mitternacht) oder null bei ungültigem Input. */
export function dateObj(iso: string | null | undefined): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
	return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

/** ISO-Wochentag: Mo=1 … So=7. */
export function isoWeekday(dt: Date): number {
	return ((dt.getUTCDay() + 6) % 7) + 1;
}

/** Montag der Woche (UTC). */
export function mondayOf(dt: Date): Date {
	const m = new Date(dt);
	m.setUTCDate(dt.getUTCDate() - (isoWeekday(dt) - 1));
	return m;
}

/** ISO-8601-Kalenderwoche (1–53). */
export function isoWeekNum(dt: Date): number {
	const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
	d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // Donnerstag dieser Woche
	const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
	firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
	return 1 + Math.round((d.getTime() - firstThu.getTime()) / MS_PER_WEEK);
}

/** „dd.mm." (UTC). */
export function ddmm(dt: Date): string {
	return `${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}.`;
}

/**
 * Minuten seit Mitternacht aus der Wanduhrzeit eines ISO-Strings (die Ziffern
 * hinter „T", also inklusive des im String kodierten Offsets). null, wenn keine
 * Zeit enthalten ist.
 */
export function minutesOfDay(iso: string | null | undefined): number | null {
	const m = /T(\d{2}):(\d{2})/.exec(String(iso ?? ''));
	return m ? +m[1] * 60 + +m[2] : null;
}

/** Minuten seit Mitternacht → „08:30". */
export function hhmm(min: number): string {
	return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
