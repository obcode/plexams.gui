// Reine Helfer für den Konflikt-Bewertungs-Loop (ExamConflictsPanel).

/** Reihenfolge-unabhängiger Schlüssel eines Prüfungspaars, z. B. „12-34". */
export function pairKey(a: number, b: number): string {
	return [a, b].sort((x, y) => x - y).join('-');
}

/**
 * „auto"-Konflikt: es gibt betroffene Studierende und ALLE sind autoAccepted
 * (Wiederholer bzw. gleicher Slot — niemand schreibt beide). Solche Konflikte
 * landen in der separaten, eingeklappten Section.
 */
export function isAutoConflict(c: { affectedStudents?: { autoAccepted?: boolean }[] }): boolean {
	const students = c.affectedStudents ?? [];
	return students.length > 0 && students.every((s) => s.autoAccepted);
}
