// Was die Fehler-Telemetrie diesen Rechner verlassen lässt, geht hier durch.
//
// Das Gegenstück zu `obs/scrub.go` im Backend, mit derselben Richtung: eine
// **Positivliste**. Was nicht ausdrücklich erlaubt ist, fliegt raus — eine
// Sperrliste müsste gegen jede künftige Zeile nachgepflegt werden, diese
// Richtung ist von selbst sicher.
//
// Der schärfste Leckweg ist hier ein anderer als im Backend: nicht Logfelder,
// sondern **Request-Bodies**. 128 der 134 `/api`-Proxys reichen den Body des
// Browsers ans Backend durch, und in dem stehen bei `addNTA` & Co. Name,
// Mailadresse und Matrikelnummer. Der Body wird deshalb gar nicht erst
// mitgeschickt, egal was das SDK dazu meint.

/**
 * Tag-Schlüssel, die mitdürfen. Bewusst NICHT dabei: mtknr, name, email,
 * teacher, shortname, invigilator, examer, to, user. Aufnehmen erst, wenn
 * geprüft ist, dass der Schlüssel keine Identität tragen kann.
 */
const ALLOWED_TAGS = new Set([
	'semester',
	'program',
	'ancode',
	'ancodes',
	'room',
	'kind',
	'source',
	'operation',
	'day',
	'status',
	'route'
]);

/**
 * Request-Header, die mitdürfen. `x-remote-user` trägt die angemeldete
 * Mailadresse, `cookie` die Sitzung — beide fehlen hier mit Absicht.
 */
const ALLOWED_HEADERS = new Set(['user-agent', 'content-type', 'accept', 'accept-language']);

/**
 * Contexts, die das SDK selbst füllt und die keine Fachdaten tragen. Alles
 * andere — insbesondere `state`, in dem SvelteKit beliebige Daten ablegen kann
 * — wird verworfen.
 */
const ALLOWED_CONTEXTS = new Set([
	'browser',
	'os',
	'device',
	'runtime',
	'culture',
	'trace',
	'app',
	'response'
]);

/**
 * Eine Matrikelnummer hat 7–10 Ziffern. Ancodes haben 3–5, Jahreszahlen 4 —
 * die bleiben also lesbar. Epoch-Zeitstempel und lange Dauern fallen mit
 * darunter; in Freitext ist das der richtige Tausch.
 */
const RE_MTKNR = /\b\d{7,10}\b/g;
const RE_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * Entfernt die beiden personenbezogenen Kennzeichen, die in Freitext
 * (Meldungen, Fehlertexte, URLs) auftauchen können. Mailadressen zuerst: eine
 * Adresse kann eine Ziffernfolge enthalten, die sonst vorher zerhackt würde.
 *
 * Namen lassen sich nicht mustern. Genau deshalb gibt es die Positivlisten
 * oben — diese Funktion ist die zweite Verteidigungslinie, nicht die erste.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function redact(value) {
	if (value === null || value === undefined) return '';
	return String(value).replace(RE_EMAIL, '[email]').replace(RE_MTKNR, '[mtknr]');
}

/**
 * Wirft Query-String und Fragment weg und redigiert den Rest. Die Detailseite
 * `/nta/[mtknr]`, bei der die URL selbst die Matrikelnummer war, ist zwar
 * gelöscht — aber eine Download-Route, die morgen ein `?mtknr=` bekommt, ist
 * ein ganz normaler Dienstag.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function redactUrl(value) {
	if (value === null || value === undefined) return '';
	const raw = String(value);
	try {
		// Basis nur, damit relative Pfade parsen; sie taucht im Ergebnis nie auf.
		const url = new URL(raw, 'http://x.invalid');
		const path = redact(url.pathname);
		return raw.startsWith('/') || !raw.includes('://') ? path : redact(url.origin) + path;
	} catch {
		return redact(raw.split(/[?#]/)[0]);
	}
}

/**
 * Behält aus einem Objekt die erlaubten Schlüssel und redigiert deren Werte.
 * Liefert `undefined` für ein leeres Ergebnis, damit das Feld gar nicht erst
 * im Payload landet.
 *
 * @param {Record<string, any> | undefined} source
 * @param {Set<string>} allowed
 * @param {(key: string) => string} [normalize] Schlüssel vor dem Vergleich vereinheitlichen
 * @returns {Record<string, string> | undefined}
 */
function allowEntries(source, allowed, normalize = (k) => k) {
	if (!source || typeof source !== 'object') return undefined;
	/** @type {Record<string, string>} */
	const out = {};
	for (const [key, value] of Object.entries(source)) {
		if (allowed.has(normalize(key))) out[key] = redact(value);
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Behält die erlaubten Contexts unverändert (sie sind SDK-Metadaten, kein
 * Freitext) und verwirft den Rest.
 *
 * @param {Record<string, any> | undefined} contexts
 * @returns {Record<string, any> | undefined}
 */
function allowContexts(contexts) {
	if (!contexts || typeof contexts !== 'object') return undefined;
	/** @type {Record<string, any>} */
	const out = {};
	for (const [key, value] of Object.entries(contexts)) {
		if (ALLOWED_CONTEXTS.has(key)) out[key] = value;
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * `beforeBreadcrumb`. Breadcrumbs sind hier die gefährlichste Spur: das SDK
 * legt für jeden `fetch` und jede Navigation einen an, samt vollständiger URL —
 * und die `/api`-Aufrufe der Seite laufen alle durch `fetch`.
 *
 * @param {import('@sentry/sveltekit').Breadcrumb} breadcrumb
 * @returns {import('@sentry/sveltekit').Breadcrumb | null}
 */
export function scrubBreadcrumb(breadcrumb) {
	if (!breadcrumb) return null;

	// Konsolenausgaben tragen beliebige Anwendungsdaten und haben in einem
	// Fehlerbericht nichts zu suchen, den ein Server außerhalb der Hochschule
	// niemals sehen soll.
	if (breadcrumb.category === 'console') return null;

	if (breadcrumb.message) breadcrumb.message = redact(breadcrumb.message);

	if (breadcrumb.data && typeof breadcrumb.data === 'object') {
		/** @type {Record<string, any>} */
		const data = {};
		for (const [key, value] of Object.entries(breadcrumb.data)) {
			if (key === 'url' || key === 'to' || key === 'from') {
				data[key] = redactUrl(value);
			} else if (key === 'method' || key === 'status_code' || key === 'http.response.status_code') {
				data[key] = value;
			} else if (ALLOWED_TAGS.has(key)) {
				data[key] = typeof value === 'string' ? redact(value) : value;
			}
		}
		breadcrumb.data = data;
	}

	return breadcrumb;
}

/**
 * `beforeSend`. Baut die heiklen Teile des Events neu auf, statt einzelne
 * Felder zu löschen: was niemand vorhergesehen hat, fällt damit von selbst
 * weg statt durchzurutschen.
 *
 * @param {import('@sentry/sveltekit').ErrorEvent} event
 * @returns {import('@sentry/sveltekit').ErrorEvent | null}
 */
export function scrubEvent(event) {
	if (!event) return null;

	if (event.message) event.message = redact(event.message);
	if (event.transaction) event.transaction = redactUrl(event.transaction);

	for (const value of event.exception?.values ?? []) {
		if (value.value) value.value = redact(value.value);
		if (value.type) value.type = redact(value.type);
	}

	if (event.request) {
		event.request = {
			method: event.request.method,
			url: redactUrl(event.request.url),
			// Header-Namen kommen je nach Laufzeit in unterschiedlicher
			// Schreibweise an; kleingeschrieben verglichen.
			headers: allowEntries(event.request.headers, ALLOWED_HEADERS, (k) => k.toLowerCase())
			// `data` (der Request-Body), `query_string` und `cookies` fehlen
			// hier mit Absicht und dauerhaft.
		};
	}

	event.tags = allowEntries(event.tags, ALLOWED_TAGS);
	event.contexts = allowContexts(event.contexts);
	// `extra` ist ein Sammelbecken ohne festes Schema — nichts, was man
	// zeilenweise prüfen kann, also gar nicht.
	delete event.extra;

	if (event.user) {
		// Nur die pseudonyme Kennung, die das Backend vergibt. Adresse, Name
		// und IP gehen nicht mit.
		event.user = event.user.id ? { id: String(event.user.id) } : undefined;
	}

	event.breadcrumbs = (event.breadcrumbs ?? [])
		.map((breadcrumb) => scrubBreadcrumb(breadcrumb))
		.filter((breadcrumb) => breadcrumb !== null);

	return event;
}
