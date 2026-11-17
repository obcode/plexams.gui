// Zugangsprüfung je Kennung, mit Cache. Rein und ohne SvelteKit-Abhängigkeit,
// damit sie einzeln testbar ist; hooks.server.js verdrahtet sie mit dem Backend.
//
// Drei Ergebnisse, nicht zwei:
// - 'allowed'      das Backend kennt die Kennung
// - 'denied'       das Backend hat geantwortet und abgelehnt (4xx, GraphQL-Fehler)
// - 'unavailable'  keine verwertbare Antwort (Netzwerk, Timeout, 5xx)
//
// Früher galt jede Antwort mit `.response` als Ablehnung. graphql-request hängt
// `.response` aber an jeden Nicht-2xx-Status, auch an das 500 „cannot verify
// user", das das Backend bei einem Datenbankfehler schickt – ein Ausfall sah also
// aus wie „Kein Zutritt". Und der Cache hatte genau einen Eintrag: Bei zwei
// abwechselnden Nutzern lief jeder Request erneut ans Backend.

/** @typedef {'allowed' | 'denied' | 'unavailable'} Access */

/**
 * Ordnet das Ergebnis einer Probe ein.
 *
 * @param {{ ok: true, data: any } | { ok: false, error: any }} result
 * @returns {Access}
 */
export function classify(result) {
	if (result.ok) return result.data?.me?.email ? 'allowed' : 'denied';
	const status = result.error?.response?.status;
	if (result.error?.response && (status === undefined || status < 500)) return 'denied';
	return 'unavailable';
}

/**
 * @param {{
 *   probe: (user: string) => Promise<any>,
 *   now?: () => number,
 *   ttlMs?: number,
 *   staleMs?: number,
 *   unavailableTtlMs?: number,
 *   maxEntries?: number
 * }} options
 */
export function createAccessCheck({
	probe,
	now = Date.now,
	ttlMs = 30_000,
	staleMs = 10 * 60_000,
	unavailableTtlMs = 5_000,
	maxEntries = 500
}) {
	/** @type {Map<string, { access: Access, expires: number, known?: { access: Access, at: number } }>} */
	const cache = new Map();
	/** @type {Map<string, Promise<Access>>} */
	const inflight = new Map();

	/** @param {string} user @param {{ access: Access, expires: number, known?: { access: Access, at: number } }} entry */
	function remember(user, entry) {
		cache.delete(user); // neu einfügen = ans Ende, die Map ist nach Alter sortiert
		cache.set(user, entry);
		while (cache.size > maxEntries) {
			const oldest = cache.keys().next().value;
			if (oldest === undefined) break;
			cache.delete(oldest);
		}
	}

	/** @param {string} user @returns {Promise<Access>} */
	async function refresh(user) {
		/** @type {Access} */
		let access;
		try {
			access = classify({ ok: true, data: await probe(user) });
		} catch (error) {
			access = classify({ ok: false, error });
		}
		const t = now();
		const previous = cache.get(user)?.known;
		if (access === 'unavailable') {
			// Bekannte Kennungen arbeiten mit dem letzten Stand weiter, solange er
			// nicht zu alt ist – ein Neustart des Backends sperrt niemanden aus.
			if (previous && t - previous.at <= staleMs) {
				remember(user, { access: previous.access, expires: t + unavailableTtlMs, known: previous });
				return previous.access;
			}
			remember(user, { access, expires: t + unavailableTtlMs, known: previous });
			return access;
		}
		remember(user, { access, expires: t + ttlMs, known: { access, at: t } });
		return access;
	}

	/**
	 * @param {string} user
	 * @returns {Promise<Access>}
	 */
	return async function check(user) {
		const entry = cache.get(user);
		if (entry && now() < entry.expires) return entry.access;
		const running = inflight.get(user);
		if (running) return running;
		const p = refresh(user).finally(() => inflight.delete(user));
		inflight.set(user, p);
		return p;
	};
}
