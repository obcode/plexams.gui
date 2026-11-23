// Browser-seitiger Aufruf eines /api-Proxys (gqlProxy). Der Proxy antwortet im
// Fehlerfall mit HTTP 400 und `{ error }` — wer dann ungeprüft `data.<feld>`
// übernimmt, bekommt `undefined`, und das nächste `.filter` oder `for…of` wirft
// „undefined is not an object". postApi wirft stattdessen mit der lesbaren Meldung
// des Backends; der Aufrufer zeigt sie an und fällt auf einen leeren Wert zurück.

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
	if (!res.ok || data?.error) throw new Error(data?.error || `Fehler (HTTP ${res.status})`);
	return data;
}

/**
 * Lesbare Meldung aus einem gefangenen Fehler.
 * @param {unknown} e
 * @returns {string}
 */
export function errorMessage(e) {
	return e instanceof Error ? e.message : String(e);
}
