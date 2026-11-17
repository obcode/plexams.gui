// Zugangsprüfung je Kennung, mit Cache. Rein und ohne SvelteKit-Abhängigkeit,
// damit sie einzeln testbar ist; hooks.server.js verdrahtet sie mit dem Backend.
//
// Die Kennung wird zweimal gefragt, getrennt und parallel: `me` an der
// Planungs-API und `session` an der Portal-API. Nie in einem Dokument – `me: User!`
// ist nicht nullbar und risse die Antwort mit, und ein älteres Backend ohne
// Portal würde das unbekannte Feld ablehnen. Daraus wird eine von vier Antworten:
//
// - 'staff'        die Kennung hat eine Rolle in der Planung (und vielleicht Portal)
// - 'portal'       keine Planungsrolle, aber Zugang zum Portal
// - 'denied'       das Backend hat geantwortet und abgelehnt
// - 'unavailable'  keine verwertbare Antwort (Netzwerk, Timeout, 5xx)
//
// graphql-request hängt `.response` an jeden Nicht-2xx-Status, auch an das 500
// „cannot verify user". Deshalb zählt nur eine 4xx-Antwort oder ein GraphQL-Fehler
// als Ablehnung; 5xx und Netzwerkfehler heißen „nicht erreichbar".

/** @typedef {'staff' | 'portal' | 'denied' | 'unavailable'} Access */
/** @typedef {{ access: Access, session?: any }} AccessResult */
/** @typedef {{ ok: true, data: any } | { ok: false, error: any }} Outcome */

/**
 * Ordnet einen Fehler ein.
 * @param {any} error
 * @returns {'denied' | 'unavailable'}
 */
export function classifyError(error) {
	const status = error?.response?.status;
	if (error?.response && (status === undefined || status < 500)) return 'denied';
	return 'unavailable';
}

/**
 * Führt die beiden Antworten zusammen.
 *
 * @param {Outcome} me Antwort auf `me` (Planungs-API)
 * @param {Outcome} session Antwort auf `session` (Portal-API)
 * @returns {AccessResult}
 */
export function combine(me, session) {
	const portalSession = session.ok ? session.data?.session : undefined;
	if (me.ok) {
		return me.data?.me?.email ? { access: 'staff', session: portalSession } : { access: 'denied' };
	}
	if (classifyError(me.error) === 'unavailable') return { access: 'unavailable' };
	// Die Planung lehnt ab. Das Portal entscheidet; ein Backend ohne Portal
	// antwortet dort mit 404 – das ist eine Ablehnung, kein Ausfall.
	if (session.ok)
		return portalSession ? { access: 'portal', session: portalSession } : { access: 'denied' };
	return { access: classifyError(session.error) };
}

/**
 * @param {{
 *   probe: (user: string) => Promise<AccessResult>,
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
	/** @type {Map<string, { result: AccessResult, expires: number, known?: { result: AccessResult, at: number } }>} */
	const cache = new Map();
	/** @type {Map<string, Promise<AccessResult>>} */
	const inflight = new Map();

	/**
	 * @param {string} user
	 * @param {{ result: AccessResult, expires: number, known?: { result: AccessResult, at: number } }} entry
	 */
	function remember(user, entry) {
		cache.delete(user); // neu einfügen = ans Ende, die Map ist nach Alter sortiert
		cache.set(user, entry);
		while (cache.size > maxEntries) {
			const oldest = cache.keys().next().value;
			if (oldest === undefined) break;
			cache.delete(oldest);
		}
	}

	/** @param {string} user @returns {Promise<AccessResult>} */
	async function refresh(user) {
		/** @type {AccessResult} */
		let result;
		try {
			result = await probe(user);
		} catch {
			result = { access: 'unavailable' };
		}
		const t = now();
		const previous = cache.get(user)?.known;
		if (result.access === 'unavailable') {
			// Bekannte Kennungen arbeiten mit dem letzten Stand weiter, solange er
			// nicht zu alt ist – ein Neustart des Backends sperrt niemanden aus.
			if (previous && t - previous.at <= staleMs) {
				remember(user, { result: previous.result, expires: t + unavailableTtlMs, known: previous });
				return previous.result;
			}
			remember(user, { result, expires: t + unavailableTtlMs, known: previous });
			return result;
		}
		remember(user, { result, expires: t + ttlMs, known: { result, at: t } });
		return result;
	}

	/**
	 * @param {string} user
	 * @returns {Promise<AccessResult>}
	 */
	return async function check(user) {
		const entry = cache.get(user);
		if (entry && now() < entry.expires) return entry.result;
		const running = inflight.get(user);
		if (running) return running;
		const p = refresh(user).finally(() => inflight.delete(user));
		inflight.set(user, p);
		return p;
	};
}

/**
 * Wohin eine Kennung mit der gegebenen Antwort auf diesem Pfad darf.
 *
 * @param {Access} access
 * @param {string} pathname
 * @returns {'pass' | 'deny' | 'unavailable' | 'to-portal' | 'portal-only'}
 */
export function decide(access, pathname) {
	if (access === 'unavailable') return 'unavailable';
	if (access === 'denied') return 'deny';
	if (access === 'staff') return 'pass';
	// access === 'portal': nur das Portal und der Telemetrie-Tunnel.
	if (isPortalPath(pathname) || pathname === '/monitoring') return 'pass';
	if (pathname === '/') return 'to-portal';
	return 'portal-only';
}

/** @param {string} pathname */
export function isPortalPath(pathname) {
	return pathname === '/portal' || pathname.startsWith('/portal/');
}
