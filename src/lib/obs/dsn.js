// Zerlegt eine Sentry-DSN. Gebraucht vom Tunnel (src/routes/monitoring), der
// wissen muss, wohin ein Envelope gehört — und vor allem, wohin nicht.

/**
 * @typedef {object} ParsedDsn
 * @property {string} origin Schema + Host + Port, ohne den öffentlichen Schlüssel
 * @property {string} projectId die Projekt-Nummer am Ende der DSN
 * @property {string} publicKey der öffentliche Ingest-Schlüssel, also der Benutzerteil der DSN
 * @property {string} ingestUrl vollständige Envelope-Adresse, mit sentry_key
 */

/**
 * @param {string | undefined | null} dsn
 * @returns {ParsedDsn | null} `null`, wenn die DSN fehlt oder unbrauchbar ist
 */
export function parseDsn(dsn) {
	if (!dsn) return null;
	let url;
	try {
		url = new URL(dsn);
	} catch {
		return null;
	}
	if (!url.protocol.startsWith('http')) return null;

	// Der Pfad ist `/<projektId>`, bei einer Installation in einem Unterpfad
	// `/<prefix>/<projektId>`.
	const segments = url.pathname.split('/').filter(Boolean);
	const projectId = segments.pop();
	if (!projectId) return null;
	const prefix = segments.length > 0 ? `/${segments.join('/')}` : '';

	return {
		// URL.origin lässt den öffentlichen Schlüssel weg — genau richtig, denn
		// verglichen wird der Zielserver, nicht die Berechtigung.
		origin: url.origin,
		projectId,
		publicKey: url.username,
		// sentry_key gehört mit in die Adresse. Ein getunnelter Envelope trägt
		// zwar seine DSN im Kopf, aber GlitchTip authentifiziert daran nicht: es
		// will den Schlüssel als Query-Parameter oder als X-Sentry-Auth-Header
		// und antwortet sonst mit 403 — was wie ein Konfigurationsfehler
		// aussieht und keiner ist. (sentry.io ist an dieser Stelle laxer, das
		// offizielle Tunnel-Beispiel funktioniert deshalb nur dort.)
		ingestUrl:
			`${url.origin}${prefix}/api/${projectId}/envelope/` +
			(url.username ? `?sentry_key=${encodeURIComponent(url.username)}` : '')
	};
}
