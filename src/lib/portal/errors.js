// Fehlercodes der Portal-API (extensions.code) als deutsche Meldungen. Die API
// liefert feste Codes, damit hier keine englischen Texte geparst werden müssen.

/** @type {Record<string, string>} */
const MESSAGES = {
	FORBIDDEN: 'Dafür fehlt Ihnen die Berechtigung.',
	INTERACTIVE_ONLY: 'Das geht nur angemeldet im Browser, nicht mit einem Token.',
	READ_ONLY_TOKEN: 'Dieses Token darf nur lesen.',
	INVALID_INPUT: 'Die Eingabe ist ungültig.',
	NOT_FOUND: 'Nicht gefunden.',
	INVALID_TOKEN: 'Das Token ist ungültig, abgelaufen oder widerrufen.',
	NOT_AFFECTED: 'Diese Abfrage betrifft Sie nicht.',
	INQUIRY_CLOSED:
		'Die Abfrage ist geschlossen; Änderungen nimmt jetzt nur noch die Prüfungsplanung vor.',
	SEMESTER_READ_ONLY: 'Das Semester ist schreibgeschützt.',
	REVISION_CONFLICT:
		'Der Eintrag wurde inzwischen geändert (z. B. in einem anderen Fenster). Bitte laden Sie die Seite neu.'
};

/**
 * @param {any} e Fehler von graphql-request
 * @returns {string}
 */
export function portalErrorMessage(e) {
	const err = e?.response?.errors?.[0];
	const code = err?.extensions?.code;
	if (code && MESSAGES[code]) {
		// Bei ungültiger Eingabe sagt die API, was nicht passt (englisch, kurz).
		const detail = code === 'INVALID_INPUT' ? String(err.message ?? '').split(': ')[1] : '';
		return detail ? `${MESSAGES[code]} (${detail})` : MESSAGES[code];
	}
	if (e?.response) return 'Die Anfrage wurde abgelehnt.';
	return 'Die Prüfungsplanung ist gerade nicht erreichbar.';
}
