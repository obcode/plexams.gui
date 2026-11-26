import { plannerErrorMessage } from '#lib/errors/plannerErrors.js';

// Helpers for the streamed operations (imports, generation, mail, validation): they
// report failures as ERROR lines `{ level, text, code }` instead of GraphQL errors.

/** Removes ANSI colour codes, so a terminal line reads as plain text. */
export const stripAnsi = (/** @type {string | null | undefined} */ t) =>
	// eslint-disable-next-line no-control-regex
	(t ?? '').replace(/\u001b?\[[0-9;]*m/g, '');

/**
 * The message for an ERROR line of a stream.
 * @param {{ text?: string | null, code?: string | null }} line
 * @returns {string}
 */
export function streamErrorMessage(line) {
	return plannerErrorMessage(line?.code, stripAnsi(line?.text));
}

/** Shown when the websocket to the backend broke while an operation was streaming. */
export const CONNECTION_LOST_MESSAGE =
	'Die Verbindung zum Plexams-Server ist abgebrochen. Der Vorgang läuft auf dem Server möglicherweise weiter. Lade die Seite neu und prüfe das Ergebnis, bevor du ihn noch einmal startest.';

/**
 * The message for an error of the subscription itself (not an ERROR line).
 * graphql-ws hands over an Error, a list of GraphQL errors or a CloseEvent.
 * @param {any} err
 * @returns {string}
 */
export function streamFailureMessage(err) {
	if (Array.isArray(err) && err.length) {
		return err
			.map((/** @type {any} */ e) => plannerErrorMessage(e?.extensions?.code, e?.message))
			.join(' ');
	}
	return CONNECTION_LOST_MESSAGE;
}

/** Shown when the websocket client itself could not be loaded. */
export const CLIENT_LOAD_MESSAGE =
	'Die Live-Verbindung zum Plexams-Server konnte nicht aufgebaut werden. Lade die Seite neu und versuche es noch einmal.';
