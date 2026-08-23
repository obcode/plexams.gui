import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Lebenszeichen des SSR-Node-Prozesses.
 *
 * `/healthz` gehört dem Backend (plexams.go, graph/server.go). Die Oberfläche läuft in einem
 * eigenen Container, und hinter forward_auth sieht ein hängender SvelteKit-Prozess aus wie ein
 * gesunder: eine Anfrage auf `/` beantwortet oauth2-proxy mit einer Umleitung zur Anmeldung,
 * ohne den Container je zu fragen. Diese Route ist der einzige Weg, „die GUI antwortet" von
 * „die Haustür antwortet" zu unterscheiden.
 *
 * Caddys Pfadprüfung ist exakt, `/healthz` und `/healthz/gui` kommen sich also nicht ins
 * Gehege. Auf glabs und tallox liegt derselbe Pfad.
 *
 * Bewusst ohne jede weitere Prüfung — nicht die Identität, nicht plexams.go, nicht die
 * Datenbank. Die Route beantwortet eine Frage: läuft dieser Prozess, welcher Build ist es. Und
 * sie muss sie auch dann beantworten, wenn das Backend weg ist; dessen Ausfall hat einen
 * eigenen Wächter. Ein Lebenszeichen, das von fremden Diensten abhängt, meldet fremde Ausfälle
 * als eigene und macht damit beide Meldungen unbrauchbar.
 */
export const GET: RequestHandler = () =>
	json(
		{ status: 'ok', version: __APP_VERSION__, built: __BUILD_TIME__ },
		// Ein zwischengespeichertes Lebenszeichen ist eine Lüge mit Verfallsdatum.
		{ headers: { 'Cache-Control': 'no-store' } }
	);
