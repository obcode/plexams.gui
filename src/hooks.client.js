import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import { commonOptions } from '$lib/obs/options';

// Fehler-Telemetrie im Browser. Ohne PUBLIC_SENTRY_DSN passiert nichts.

// Standard ist der Tunnel über den eigenen Origin. `off` schaltet auf den
// direkten Weg zurück — dann muss der Monitoring-Host allerdings vom Browser
// aus erreichbar sein.
const tunnel = env.PUBLIC_SENTRY_TUNNEL ?? '/monitoring';

if (env.PUBLIC_SENTRY_DSN) {
	Sentry.init({
		...commonOptions,
		dsn: env.PUBLIC_SENTRY_DSN,
		environment: env.PUBLIC_SENTRY_ENVIRONMENT,
		release: __APP_VERSION__,

		// Siehe src/routes/monitoring/+server.js.
		tunnel: tunnel === 'off' ? undefined : tunnel

		// Bewusst NICHT eingebunden: Sentry.replayIntegration(). Ein Replay ist
		// eine Videoaufzeichnung der Oberfläche — und damit der
		// Matrikelnummern, die darauf zu sehen sind. Es gehört zu keiner
		// Voreinstellung; es muss hier stehen, um zu wirken. Also nicht.
	});
}

/**
 * Was im Browser niemand abfängt. Gibt dieselbe Form zurück wie die
 * serverseitige Fassung, damit +error.svelte nur einen Fall kennt.
 *
 * @type {import('@sveltejs/kit').HandleClientError}
 */
function describeError({ error }) {
	console.error(error);
	return {
		message: 'Unerwarteter Fehler. Die Prüfungsplanung wurde benachrichtigt.',
		eventId: Sentry.lastEventId()
	};
}

export const handleError = Sentry.handleErrorWithSentry(describeError);
