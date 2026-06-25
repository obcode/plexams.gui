// Geteilte Logik für die ZPA↔Primuss-Zuordnung (/exam/connected).
// Warnstufen: error > warning > info > ok (Theme-Tokens, keine festen Farben).

/** @type {Record<string, { rank: number, border: string, tint: string, dot: string }>} */
export const LEVEL = {
	error: { rank: 3, border: 'border-error', tint: 'bg-error/5', dot: 'bg-error' },
	warning: { rank: 2, border: 'border-warning', tint: 'bg-warning/5', dot: 'bg-warning' },
	info: { rank: 1, border: 'border-base-300', tint: '', dot: 'bg-base-content/25' },
	ok: { rank: 0, border: 'border-success/40', tint: '', dot: 'bg-success' }
};

/** Höchste Warnstufe einer Zuordnung. @param {any} exam */
export function levelOf(exam) {
	let max = 'ok';
	for (const w of exam.warnings ?? []) {
		if ((LEVEL[w.level]?.rank ?? 0) > LEVEL[max].rank) max = w.level;
	}
	// keine zugeordnete Primuss-Prüfung ist immer ein echtes Problem
	if ((exam.primussExams ?? []).length === 0 && LEVEL[max].rank < LEVEL.warning.rank)
		max = 'warning';
	return max;
}

/** @param {any} exam @param {string} lvl */
export const warningsOf = (exam, lvl) =>
	(exam.warnings ?? []).filter((/** @type {any} */ w) => w.level === lvl);

/** „ruhig" = unauffällig (ok oder nur Hinweise). @param {string} level */
export const isCalm = (level) => level === 'ok' || level === 'info';
