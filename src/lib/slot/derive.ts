// Zeitbasiertes Modell: PlanEntry/PlannedRoom/UnplacedExam/BlockedRoom/
// PrePlannedInvigilation liefern nur noch `starttime` (kein day/slot mehr). Wo die GUI
// „Tag/Spalte" bzw. „Slot-Nummer" braucht, wird das lokal aus der Startzeit abgeleitet:
// der Kalendertag matcht einen semesterConfig.days-Eintrag, die Uhrzeit eine
// semesterConfig.starttimes-Anfangszeit. Das Backend rechnet intern genauso
// (SlotForTime); hier reicht der lokale Vergleich für Anzeige/Gruppierung/Keys.
import { starttimeHHMM } from '$lib/exam/setExamTime';

// ExamDay/Starttime tragen keine `number` mehr (Backend-Zeitmodell). Die frühere
// 1-basierte Tag-/Slot-Nummer entspricht exakt der Position im (chronologisch
// sortierten) days-/starttimes-Array — sie wird hier über den Index abgeleitet.
export type DayRef = { date: string };
export type TimeRef = { start: string };

/** Kalendertag „yyyy-mm-dd" (Ortszeit laut ISO-Offset) einer Startzeit. */
export function dateKey(iso: string | null | undefined): string {
	return String(iso ?? '').slice(0, 10);
}

/** dayNumber (1-basierte Position im days-Array) einer Startzeit; 0, wenn kein Prüfungstag. */
export function dayNumberForTime(
	iso: string | null | undefined,
	days: DayRef[] | null | undefined
): number {
	const k = dateKey(iso);
	if (!k) return 0;
	const i = (days ?? []).findIndex((d) => dateKey(d.date) === k);
	return i < 0 ? 0 : i + 1;
}

/** slotNumber (1-basierte Position im starttimes-Array) einer Startzeit; 0, wenn keine Standard-Anfangszeit. */
export function slotNumberForTime(
	iso: string | null | undefined,
	starttimes: TimeRef[] | null | undefined
): number {
	const hm = starttimeHHMM(iso);
	if (!hm) return 0;
	const i = (starttimes ?? []).findIndex((t) => (t.start ?? '').slice(0, 5) === hm);
	return i < 0 ? 0 : i + 1;
}

/** true, wenn die Startzeit auf einen echten Prüfungstag fällt (innerhalb des Zeitraums). */
export function inPeriod(
	iso: string | null | undefined,
	days: DayRef[] | null | undefined
): boolean {
	return dayNumberForTime(iso, days) > 0;
}
