// Zeitbasiertes Modell: PlanEntry/PlannedRoom/UnplacedExam/BlockedRoom/
// PrePlannedInvigilation liefern nur noch `starttime` (kein day/slot mehr). Wo die GUI
// „Tag/Spalte" bzw. „Slot-Nummer" braucht, wird das lokal aus der Startzeit abgeleitet:
// der Kalendertag matcht einen semesterConfig.days-Eintrag, die Uhrzeit eine
// semesterConfig.starttimes-Anfangszeit. Das Backend rechnet intern genauso
// (SlotForTime); hier reicht der lokale Vergleich für Anzeige/Gruppierung/Keys.
import { starttimeHHMM } from '$lib/exam/setExamTime';

export type DayRef = { number: number; date: string };
export type TimeRef = { number: number; start: string };

/** Kalendertag „yyyy-mm-dd" (Ortszeit laut ISO-Offset) einer Startzeit. */
export function dateKey(iso: string | null | undefined): string {
	return String(iso ?? '').slice(0, 10);
}

/** dayNumber einer Startzeit über den Kalendertag; 0, wenn kein Prüfungstag. */
export function dayNumberForTime(
	iso: string | null | undefined,
	days: DayRef[] | null | undefined
): number {
	const k = dateKey(iso);
	if (!k) return 0;
	return (days ?? []).find((d) => dateKey(d.date) === k)?.number ?? 0;
}

/** slotNumber einer Startzeit über die Uhrzeit (HH:MM); 0, wenn keine Standard-Anfangszeit. */
export function slotNumberForTime(
	iso: string | null | undefined,
	starttimes: TimeRef[] | null | undefined
): number {
	const hm = starttimeHHMM(iso);
	if (!hm) return 0;
	return (starttimes ?? []).find((t) => (t.start ?? '').slice(0, 5) === hm)?.number ?? 0;
}

/** true, wenn die Startzeit auf einen echten Prüfungstag fällt (innerhalb des Zeitraums). */
export function inPeriod(
	iso: string | null | undefined,
	days: DayRef[] | null | undefined
): boolean {
	return dayNumberForTime(iso, days) > 0;
}
