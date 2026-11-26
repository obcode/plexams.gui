import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
import { clientErrorMessage } from '#lib/errors/clientErrors.js';

// Browser-seitiger Aufruf eines /api-Proxys (gqlProxy). Der Proxy antwortet im
// Fehlerfall mit HTTP 400 und `{ error }` — wer dann ungeprüft `data.<feld>`
// übernimmt, bekommt `undefined`, und das nächste `.filter` oder `for…of` wirft
// „undefined is not an object". postApi wirft stattdessen mit der lesbaren Meldung
// des Backends; der Aufrufer zeigt sie an und fällt auf einen leeren Wert zurück.

/** Error of a failed /api call; `code` is the backend's error code, if it sent one. */
export class ApiError extends Error {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
	}
}

/**
 * Message and code of a failed /api answer.
 * @param {Response} res
 * @param {any} data parsed body, or null
 * @returns {ApiError}
 */
export function apiError(res, data) {
	return new ApiError(data?.error || httpErrorMessage(res.status), data?.code);
}

/**
 * POST an einen /api-Proxy; liefert die Antwortdaten oder wirft einen Error mit der
 * Meldung des Backends.
 * @param {string} path z. B. '/api/slot/examsAt'
 * @param {Record<string, any>} [body]
 * @returns {Promise<any>}
 */
export async function postApi(path, body = {}) {
	const res = await fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok || data?.error) throw apiError(res, data);
	return data;
}

/**
 * Lesbare Meldung aus einem gefangenen Fehler.
 * @param {unknown} e
 * @returns {string}
 */
export function errorMessage(e) {
	return clientErrorMessage(e);
}
