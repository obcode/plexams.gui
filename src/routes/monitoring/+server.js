import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { parseDsn } from '$lib/obs/dsn';

// Tunnel für die Fehlerberichte des Browsers (Sentry.init({ tunnel })).
//
// Der Browser schickt seine Envelopes hierher statt direkt an GlitchTip. Das
// kostet dreißig Zeilen und kauft vier Dinge:
//
//  - Der Browser redet nur mit plexams.cs.hm.edu. Kein CORS, kein Fremdhost in
//    der CSP, kein Ad-Blocker, der „sentry" im Hostnamen sieht und blockt.
//  - Diese Route liegt hinter Caddys forward_auth. Ein unangemeldeter POST
//    landet bei sso.hm.edu und erreicht GlitchTip nie — **das
//    Missbrauchsproblem der öffentlichen DSN verschwindet damit vollständig.**
//  - Browser brauchen überhaupt keinen Netzwerkweg zum Monitoring-Host.
//  - Die tatsächliche Ingest-Adresse steht in einer privaten Variablen.
//
// Was hier NICHT passiert: der Envelope wird nicht ausgepackt und nicht
// verändert. Der Scrubber sitzt im Browser (src/lib/obs/scrub.js), also vor
// dieser Route — was hier ankommt, ist bereits sauber.

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, fetch }) {
	const target = parseDsn(env.SENTRY_DSN);
	if (!target) error(404, 'Fehler-Telemetrie ist nicht konfiguriert.');

	const envelope = await request.text();

	// Die erste Zeile eines Envelopes ist ein JSON-Kopf mit der DSN, für die er
	// bestimmt ist. Ohne diese Prüfung wäre die Route ein offenes Relais: jeder
	// könnte über unseren Server beliebige Envelopes an beliebige Projekte
	// schicken.
	const source = parseDsn(headerDsn(envelope));
	if (!source || source.origin !== target.origin || source.projectId !== target.projectId) {
		error(400, 'Envelope gehört nicht zu diesem Projekt.');
	}

	const response = await fetch(target.ingestUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/x-sentry-envelope' },
		body: envelope
	});

	// Antwort durchreichen, damit das SDK Rate-Limits (429) sieht und von selbst
	// zurückschaltet, statt weiter gegen eine Wand zu senden.
	return new Response(response.body, { status: response.status });
}

/**
 * Die DSN aus dem Kopf des Envelopes, oder undefined bei allem, was nicht wie
 * einer aussieht.
 *
 * @param {string} envelope
 * @returns {string | undefined}
 */
function headerDsn(envelope) {
	try {
		return JSON.parse(envelope.split('\n', 1)[0])?.dsn;
	} catch {
		return undefined;
	}
}
