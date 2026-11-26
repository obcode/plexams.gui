// German messages for the error codes of the planning API (extensions.code on a
// GraphQL error, `code` on an ERROR line of a stream). The backend guarantees the
// code, not the wording, so nothing here parses message text. Each message says
// what happened and what to do next, for a planner who has never seen the code.

/**
 * `replace`: the message stands alone and the backend text is dropped.
 * Otherwise the backend text is appended as a detail.
 * @type {Record<string, { text: string, replace: boolean }>}
 */
const MESSAGES = {
	READ_ONLY_ROLE: {
		text: 'Dein Zugang darf nur lesen (Rolle VIEWER), deshalb wurde nichts geändert. Zum Bearbeiten braucht dein Konto die Rolle PLANER; die vergibt ein:e Administrator:in in der Benutzerverwaltung.',
		replace: true
	},
	FORBIDDEN: {
		text: 'Das darfst du mit deinem Zugang nicht. Wenn du die Funktion brauchst, wende dich an eine:n Administrator:in (Benutzerverwaltung).',
		replace: true
	},
	SEMESTER_READ_ONLY: {
		text: 'Dieses Semester ist geschützt (nur lesen), deshalb wurde nichts geändert. Den Schutz hebst du oben in der Semesterauswahl mit „Schutz aufheben" auf.',
		replace: true
	},
	BUSY: {
		text: 'Das geht gerade nicht, weil im Hintergrund noch etwas läuft: eine Validierung, ein Import, eine Übertragung ins ZPA, ein Generierungslauf oder ein E-Mail-Versand. Warte, bis das fertig ist, und versuche es dann noch einmal.',
		replace: true
	},
	PUBLISHED_LOCKED: {
		text: 'Dieser Plan ist bereits veröffentlicht und deshalb gegen Neu-Generieren und Zurücksetzen gesperrt. Einzelne Änderungen von Hand bleiben möglich. Soll wirklich neu generiert werden, nimm zuerst auf der Startseite das Häkchen „… veröffentlicht" zurück.',
		replace: true
	},
	ALREADY_SENT: {
		text: 'Diese E-Mail wurde bereits verschickt und geht deshalb nicht noch einmal raus. Soll sie wirklich erneut gesendet werden, nimm zuerst auf der Startseite das Häkchen beim zugehörigen Schritt zurück.',
		replace: true
	},
	ALREADY_EXISTS: {
		text: 'Das gibt es bereits, deshalb wurde nichts neu angelegt.',
		replace: true
	},
	NOT_FOUND: {
		text: 'Der Eintrag wurde nicht gefunden. Vielleicht wurde er inzwischen geändert oder gelöscht; lade die Seite neu.',
		replace: true
	},
	INVALID_INPUT: { text: 'Die Eingabe passt so nicht', replace: false },
	EXTERNAL_ZPA: {
		text: 'Das ZPA hat nicht geantwortet oder die Anfrage abgelehnt. In Plexams wurde nichts verändert; versuche es später noch einmal',
		replace: false
	},
	EXTERNAL_ANNY: {
		text: 'Anny (Raumbuchung) hat nicht geantwortet oder die Anfrage abgelehnt. In Plexams wurde nichts verändert; versuche es später noch einmal',
		replace: false
	},
	EXTERNAL_SMTP: {
		text: 'Der Mailserver hat die E-Mail nicht angenommen oder war nicht erreichbar',
		replace: false
	},
	INTERNAL: {
		text: 'In Plexams ist ein interner Fehler aufgetreten. Das liegt nicht an deiner Eingabe. Versuche es noch einmal; passiert es wieder, melde es der Plexams-Betreuung mit Uhrzeit und der Seite, auf der du warst.',
		replace: true
	}
};

/** All codes this GUI has a message for. */
export const KNOWN_CODES = Object.keys(MESSAGES);

/** Shown when the backend could not be reached at all. */
export const UNREACHABLE_MESSAGE =
	'Der Plexams-Server antwortet gerade nicht. Deine Eingabe wurde nicht gespeichert. Warte einen Moment und versuche es noch einmal.';

/**
 * The message for a backend error.
 * @param {string | null | undefined} code extensions.code / LogLine.code
 * @param {string | null | undefined} [backendMessage] the backend's own text
 * @returns {string}
 */
export function plannerErrorMessage(code, backendMessage) {
	const detail = String(backendMessage ?? '')
		.replace(/^(error|Fehler):\s*/i, '')
		.trim();
	const known = code ? MESSAGES[code] : undefined;
	if (!known) return detail || 'Unbekannter Fehler.';
	if (known.replace || !detail) return known.replace ? known.text : `${known.text}.`;
	return `${known.text}: ${detail}`;
}

/**
 * The message for an HTTP answer that carried no usable error body.
 * @param {number} status
 * @returns {string}
 */
export function httpErrorMessage(status) {
	if (status === 401 || status === 403) return MESSAGES.FORBIDDEN.text;
	if (status === 409) return MESSAGES.BUSY.text;
	if (status === 423) return MESSAGES.SEMESTER_READ_ONLY.text;
	if (status >= 500) {
		return `Der Plexams-Server hat mit einem Fehler geantwortet (HTTP ${status}). Deine Eingabe wurde vermutlich nicht gespeichert. Lade die Seite neu und prüfe, ob die Änderung angekommen ist, bevor du es noch einmal versuchst.`;
	}
	return `Die Anfrage ist fehlgeschlagen (HTTP ${status}). Lade die Seite neu und versuche es noch einmal.`;
}

/** @param {string | null | undefined} code */
export const isBusy = (code) => code === 'BUSY';
