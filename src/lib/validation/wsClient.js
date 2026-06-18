import { env } from '$env/dynamic/public';

// Geteilte, lazy erzeugte Instanzen für alle Validierungs-Gruppen: ein einziger
// WebSocket (graphql-ws) und ein ANSI->HTML-Konverter. Mit lazy:true schliesst
// graphql-ws die Verbindung selbsttätig, sobald keine Subscription mehr läuft —
// deshalb ist kein manuelles dispose nötig.

/** @type {Promise<any> | null} */
let convertPromise = null;
/** @type {Promise<any> | null} */
let clientPromise = null;

function wsUrl() {
	const http = env.PUBLIC_PLEXAMS_SERVER || 'http://localhost:8080/query';
	return http.replace(/^http/, 'ws');
}

export function getConvert() {
	if (!convertPromise) {
		convertPromise = import('ansi-to-html').then(
			(m) =>
				new m.default({
					fg: '#d4d4d4',
					bg: '#1e1e2e',
					newline: false,
					escapeXML: true,
					colors: {
						0: '#1e1e2e',
						1: '#f38ba8',
						2: '#a6e3a1',
						3: '#f9e2af',
						4: '#89b4fa',
						5: '#cba6f7',
						6: '#94e2d5',
						7: '#bac2de'
					}
				})
		);
	}
	return convertPromise;
}

export function getWsClient() {
	if (!clientPromise) {
		clientPromise = import('graphql-ws').then((m) =>
			m.createClient({ url: wsUrl(), lazy: true, retryAttempts: 0 })
		);
	}
	return clientPromise;
}
