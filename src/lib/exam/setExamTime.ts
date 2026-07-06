// Manuelle Platzierung im Terminplan (Mutation setExamTime): das Backend speichert
// die absolute Startzeit und leitet Tag/Slot ab. Es akzeptiert jede Zeit — der Hinweis
// „keine Standard-Anfangszeit" ist rein client-seitig: hier geprüft gegen die
// Standard-Anfangszeiten des Semesters (semesterConfig.starttimes[].start bzw. die
// startTimes der Config).
import { hhmm, minutesOfDay } from '$lib/date/calendar';

/** Uhrzeit „HH:MM" (Ortszeit laut ISO-Offset) einer absoluten Startzeit; '' wenn unparsbar. */
export function starttimeHHMM(iso: string | null | undefined): string {
	const min = minutesOfDay(iso);
	return min == null ? '' : hhmm(min);
}

/**
 * Baut eine absolute Startzeit (Time-String) aus Datum („yyyy-mm-dd" oder Time) und
 * Uhrzeit „HH:MM", in der Zeitzone von `tzRef` (einem Backend-Time-String, aus dem der
 * Offset übernommen wird; 'Z' als Fallback). So bekommt das Backend die Zeit in genau
 * der Zeitzone seiner eigenen Tagesangaben.
 */
export function combineStarttime(
	date: string | null | undefined,
	hhmm: string | null | undefined,
	tzRef?: string | null
): string {
	const datePart = String(date ?? '').slice(0, 10);
	const ref = String(tzRef ?? '');
	const tz = ref.length > 19 ? ref.slice(19) : 'Z';
	return `${datePart}T${(hhmm ?? '').slice(0, 5)}:00${tz}`;
}

/**
 * Ist die absolute Startzeit `iso` eine der Standard-Anfangszeiten des Semesters?
 * Vergleich rein über die Uhrzeit (HH:MM). `standardStartTimes` sind die
 * Standard-Anfangszeiten als „HH:MM" (oder Time-Strings, aus denen HH:MM gelesen wird).
 */
export function isStandardStarttime(
	iso: string | null | undefined,
	standardStartTimes: readonly string[] | null | undefined
): boolean {
	const hm = starttimeHHMM(iso);
	if (!hm) return false;
	return (standardStartTimes ?? []).some(
		(s) => starttimeHHMM(s) === hm || (s ?? '').slice(0, 5) === hm
	);
}
