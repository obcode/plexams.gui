// Fakultäts-Kennung („FK03", „FK10") für die Anzeige. Quelle ist entweder
// ZPAExam.faculty (bereits „FK03") oder das Constraint-Feld notPlannedByMeInFK
// (oft rein numerisch, z. B. „10"). Reine Funktionen, aus SlotExam/plan-exams
// extrahiert, damit sie an einer Stelle leben und testbar sind.

/** Rein numerische Kennung → „FK"-Präfix; sonst unverändert (leer bleibt leer). */
export function normalizeFk(raw?: string | null): string {
	const s = (raw ?? '').trim();
	return /^\d+$/.test(s) ? `FK${s}` : s;
}

/**
 * Planende FK einer „nicht von mir geplant"-Prüfung: Fakultät der Prüfung zuerst,
 * sonst das Constraint-Feld. Beide werden normalisiert.
 */
export function planningFk(faculty?: string | null, notPlannedByMeInFK?: string | null): string {
	return normalizeFk(faculty || notPlannedByMeInFK || '');
}

/**
 * Anzeige-Ancode einer Prüfung. Domänenregel: MIT FK (fremd geplant) zeigt man
 * die fremde Primuss-Ancode („FK10: 456"), OHNE FK (eigene Prüfung) die
 * ZPA-Ancode. Fehlt die Primuss-Ancode im FK-Fall, fällt es auf die ZPA-Ancode
 * zurück.
 */
export function displayAncode(
	fk: string,
	primussAncode: number | string | null | undefined,
	zpaAncode: number | string
): string {
	return fk ? `${fk}: ${primussAncode ?? zpaAncode}` : String(zpaAncode);
}
