import { scrubBreadcrumb, scrubEvent } from './scrub';

// Die Optionen, die auf beiden Seiten gleich sein MÜSSEN. Server und Browser
// initialisieren getrennt (hooks.server.js, hooks.client.js) — der Scrubber
// darf dabei nicht an einer der beiden Stellen vergessen werden.

/** @typedef {Parameters<typeof import('@sentry/sveltekit').init>[0]} SentryOptions */

/**
 * What the SDK may collect on its own, in the browser and on the server alike: nothing.
 *
 * Sentry 11 replaced `sendDefaultPii` (default off) with this option, and its defaults collect
 * everything: user fields and the IP address, cookies, request and response headers, query
 * strings, request and response bodies, GraphQL documents and variables, and the local variables
 * of every stack frame. Here that would be the identity the auth proxy puts into the request
 * headers (`x-remote-user` is a mail address), the session cookie, the search terms in query
 * strings, and the names, mail addresses and matriculation numbers that 128 of the 134 `/api`
 * proxies carry in their bodies.
 *
 * Every switch is stated, including those for integrations this app does not use (GenAI, MCP,
 * databases, queues): a later integration must not start collecting because a default allowed
 * it. An omitted key means the permissive default, so a key Sentry adds in a later release is
 * on until it is listed here — options.test.js names the keys it expects for that reason.
 *
 * This is the first line. The scrubber in scrub.js is the second and does not rely on it.
 *
 * @type {NonNullable<SentryOptions['dataCollection']>}
 */
export const DATA_COLLECTION = {
	userInfo: false,
	cookies: false,
	httpHeaders: false,
	httpBodies: [],
	urlQueryParams: false,
	graphQL: { document: false, variables: false },
	genAI: { inputs: false, outputs: false },
	mcp: { inputs: false, outputs: false },
	databaseQueryData: false,
	queues: false,
	stackFrameVariables: false
};

/**
 * @type {Partial<SentryOptions>}
 */
export const commonOptions = {
	// Der Riegel. Siehe scrub.js.
	beforeSend: scrubEvent,
	beforeBreadcrumb: scrubBreadcrumb,

	// Not collecting is the honest order; the scrubber would remove it again, but must not be
	// the only thing standing between a mail address and the collector.
	dataCollection: DATA_COLLECTION,

	// Kein tracesSampleRate: ohne den Schlüssel ist Tracing aus. Diese
	// Anwendung hat ein paar Dutzend Nutzer und keine Frage, die eine
	// Span-Auswertung beantworten würde — und jede Transaktion wäre eine
	// weitere Stelle, an der eine URL mit hinausginge.

	// No structured logs: Sentry 11 removed `enableLogs` and sends logs only when
	// `Sentry.logger.*` or a logging integration is used. Neither is, and neither should be:
	// what belongs in Loki goes to Loki.

	// Reicht für einen Fehlerbericht und begrenzt, wie viel Vorgeschichte ein
	// lange offener Tab in einen unabhängigen Fehler mitschleppt.
	maxBreadcrumbs: 20
};
