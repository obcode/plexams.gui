import { UNREACHABLE_MESSAGE } from '#lib/errors/plannerErrors.js';

// German text for an error caught in the browser. Errors this GUI throws itself
// (ApiError, new Error(backendMessage)) already carry a German message and pass
// through. What the browser throws on its own does not: a failed fetch reads
// "Failed to fetch" (Chrome), "NetworkError when attempting to fetch resource."
// (Firefox) or "Load failed" (Safari); a broken JSON body is a SyntaxError. These
// are browser texts, not backend texts, so matching them is safe.

const NETWORK = /failed to fetch|networkerror|load failed|network request failed/i;

/** Shown when the answer of the server could not be read. */
export const UNREADABLE_MESSAGE =
	'Die Antwort des Plexams-Servers war unvollständig oder unlesbar. Lade die Seite neu und prüfe, ob die Änderung angekommen ist, bevor du es noch einmal versuchst.';

/** Shown for a fault in the page itself. */
export const PAGE_FAULT_MESSAGE =
	'In der Seite ist ein unerwarteter Fehler aufgetreten. Lade die Seite neu; passiert es wieder, melde es der Plexams-Betreuung mit Uhrzeit und Seite';

/**
 * Readable German message for a caught error.
 * @param {unknown} e
 * @returns {string}
 */
export function clientErrorMessage(e) {
	if (e instanceof DOMException && e.name === 'AbortError') return 'Der Vorgang wurde abgebrochen.';
	if (e instanceof TypeError) {
		return NETWORK.test(e.message) ? UNREACHABLE_MESSAGE : `${PAGE_FAULT_MESSAGE} (${e.message}).`;
	}
	if (e instanceof SyntaxError) return UNREADABLE_MESSAGE;
	if (e instanceof Error) return e.message || 'Unbekannter Fehler.';
	return String(e);
}
