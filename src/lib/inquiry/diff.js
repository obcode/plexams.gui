// Feldvergleich einer Meldung: was hat sich seit der zuletzt gesichteten Fassung
// geändert? Rein, damit testbar.

/** @type {Record<string, string>} */
export const FIELD_LABEL = {
	examKind: 'Art',
	module: 'Modul',
	programs: 'Studiengänge',
	expectedStudents: 'Teilnehmende',
	durationMin: 'Dauer',
	remark: 'Bemerkung'
};

/** @param {any} v */
function show(v) {
	if (v === null || v === undefined || v === '') return '–';
	return Array.isArray(v) ? v.join(', ') : String(v);
}

/**
 * @param {any} before gesichtete Fassung (oder null)
 * @param {any} now aktuelle Fassung
 * @returns {{ field: string, label: string, old: string, new: string }[]}
 */
export function preplanDiff(before, now) {
	if (!before || !now) return [];
	return Object.keys(FIELD_LABEL)
		.filter((f) => show(before[f]) !== show(now[f]))
		.map((f) => ({ field: f, label: FIELD_LABEL[f], old: show(before[f]), new: show(now[f]) }));
}

/** @type {Record<string, string>} */
export const KIND_LABEL = {
	PREPLAN: 'SEB/EXaHM-Bedarf',
	EXAMS_TO_PLAN: 'Zu planende Prüfungen',
	CONSTRAINTS: 'Besonderheiten (Constraints)',
	DRAFT_FEEDBACK: 'Rückmeldung zum Entwurf',
	INVIGILATION: 'Aufsichts-Anforderungen'
};

/** @type {Record<string, string>} */
export const ACTION_LABEL = {
	SUBMITTED: 'neu gemeldet',
	CHANGED: 'geändert',
	WITHDRAWN: 'zurückgezogen',
	NOTHING_TO_REPORT: 'nichts zu melden',
	REVOKED: '„nichts zu melden" zurückgenommen'
};

/** @type {Record<string, string>} */
export const STATE_LABEL = { DRAFT: 'Entwurf', OPEN: 'offen', CLOSED: 'geschlossen' };
