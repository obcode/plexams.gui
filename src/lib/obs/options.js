import { scrubBreadcrumb, scrubEvent } from './scrub';

// Die Optionen, die auf beiden Seiten gleich sein MÜSSEN. Server und Browser
// initialisieren getrennt (hooks.server.js, hooks.client.js) — der Scrubber
// darf dabei nicht an einer der beiden Stellen vergessen werden.

/**
 * @type {Partial<Parameters<typeof import('@sentry/sveltekit').init>[0]>}
 */
export const commonOptions = {
	// Der Riegel. Siehe scrub.js.
	beforeSend: scrubEvent,
	beforeBreadcrumb: scrubBreadcrumb,

	// Das SDK würde sonst IP-Adresse, Cookies und Request-Body von sich aus
	// mitschicken. Der Scrubber nähme sie wieder heraus; hier gar nicht erst
	// zu sammeln ist die ehrlichere Reihenfolge.
	sendDefaultPii: false,

	// Kein tracesSampleRate: ohne den Schlüssel ist Tracing aus. Diese
	// Anwendung hat ein paar Dutzend Nutzer und keine Frage, die eine
	// Span-Auswertung beantworten würde — und jede Transaktion wäre eine
	// weitere Stelle, an der eine URL mit hinausginge.

	// Strukturierte Logs an Sentry sind aus. Was in Loki gehört, geht nach
	// Loki (und erst nach dem Audit, siehe den Monitoring-Plan).
	enableLogs: false,

	// Reicht für einen Fehlerbericht und begrenzt, wie viel Vorgeschichte ein
	// lange offener Tab in einen unabhängigen Fehler mitschleppt.
	maxBreadcrumbs: 20
};
