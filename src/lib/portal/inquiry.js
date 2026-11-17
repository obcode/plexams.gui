// Bezeichnungen und Pfade der Abfragen im Portal. Die Abfrage-Arten kommen aus der
// Portal-API (InquiryKind); M2 bringt nur PREPLAN mit eigener Seite.

/** @type {Record<string, string>} */
export const KIND_LABEL = {
	PREPLAN: 'Prüfungen mit EXaHM oder SEB',
	EXAMS_TO_PLAN: 'Zu planende Prüfungen',
	CONSTRAINTS: 'Besonderheiten der Prüfungen',
	DRAFT_FEEDBACK: 'Rückmeldung zum vorläufigen Plan',
	INVIGILATION: 'Anforderungen an die Aufsichten'
};

/** @type {Record<string, string>} */
const KIND_PATH = { PREPLAN: 'exahm-seb' };

/**
 * Die Portalseite einer Abfrage, oder null, wenn es (noch) keine gibt.
 * @param {{ semester: string, kind: string }} inquiry
 * @returns {string | null}
 */
export function inquiryPath(inquiry) {
	const path = KIND_PATH[inquiry.kind];
	return path ? `/portal/${inquiry.semester}/${path}` : null;
}

/** @type {Record<string, string>} */
export const REVIEW_LABEL = {
	OPEN: 'noch nicht gesichtet',
	APPLIED: 'übernommen',
	APPLIED_MODIFIED: 'übernommen, angepasst',
	REJECTED: 'abgelehnt',
	DONE: 'erledigt'
};

/**
 * Ein Formular in eine PreplanInput-Eingabe umwandeln. Die Prüfung macht das Backend;
 * hier wird nur geformt.
 *
 * @param {FormData} form
 */
export function preplanInputFromForm(form) {
	const duration = String(form.get('durationMin') ?? '').trim();
	return {
		examKind: form.get('examKind') === 'SEB' ? 'SEB' : 'EXaHM',
		module: String(form.get('module') ?? '').trim(),
		programs: form.getAll('programs').map((p) => String(p)),
		expectedStudents: Number(form.get('expectedStudents') ?? 0) || 0,
		durationMin: duration === '' ? null : Number(duration) || null,
		remark: String(form.get('remark') ?? '').trim()
	};
}
