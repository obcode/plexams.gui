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
