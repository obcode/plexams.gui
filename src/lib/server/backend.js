import { AsyncLocalStorage } from 'node:async_hooks';
import { GraphQLClient } from 'graphql-request';
import { env } from '$env/dynamic/private';

// Identitäts-Weiterreichung an das Backend (Auth-Modell: reiner Proxy-Header).
//
// In der Produktion läuft das Backend mit auth.enabled: true und lernt die
// angemeldete Identität ausschließlich aus dem X-Remote-User-Header (Inhalt =
// verifizierte E-Mail), den der Auth-Proxy (nginx/Shibboleth) autoritativ in
// jeden Request injiziert. Der SSR-Hop des GUI läuft aber Container-zu-Container
// (PLEXAMS_SERVER = http://plexams:8080/query) an nginx vorbei — ohne diesen
// Header weist das Backend fail-closed mit 401 ab. Deshalb muss jeder
// serverseitige GraphQL-Call den Header selbst mitschicken.
//
// Statt `locals` durch ~180 load()/Handler-Signaturen zu fädeln, wird die
// Identität pro Request in einem AsyncLocalStorage abgelegt (in hooks.server.js
// rund um resolve()) und hier beim Client-Bau ausgelesen. So bleibt die
// gqlProxy-Signatur unverändert und die Aufrufstellen ändern sich minimal.

/** @typedef {{ remoteUser?: string, remoteDisplayname?: string }} AuthContext */

/** @type {AsyncLocalStorage<AuthContext>} */
export const authContext = new AsyncLocalStorage();

/**
 * GraphQLClient gegen das Backend, der die aktuelle Identität (aus dem
 * AsyncLocalStorage, sonst aus einem explizit übergebenen Kontext) als
 * X-Remote-User weiterreicht.
 *
 * @param {AuthContext} [ctx] expliziter Kontext (Fallback: laufender Request)
 */
export function backendClient(ctx) {
	const { remoteUser, remoteDisplayname } = ctx ?? authContext.getStore() ?? {};
	/** @type {Record<string, string>} */
	const headers = {};
	if (remoteUser) headers['X-Remote-User'] = remoteUser;
	if (remoteDisplayname) headers['X-Remote-Displayname'] = remoteDisplayname;
	return new GraphQLClient(env.PLEXAMS_SERVER, { headers });
}

/**
 * Kurzform für Einzel-Requests — ersetzt `request(env.PLEXAMS_SERVER, doc, vars)`.
 * Generisch wie das frühere `request<T>(…)`: ohne Typargument fällt T auf `any`
 * zurück (aus einem String-Dokument ist T nicht ableitbar).
 *
 * @template {any} [T=any]
 * @param {import('graphql-request').RequestDocument} document Query/Mutation
 * @param {Record<string, any>} [variables]
 * @returns {Promise<T>}
 */
export function backendRequest(document, variables) {
	return /** @type {Promise<T>} */ (backendClient().request(document, variables));
}

/**
 * Wie backendRequest, aber mit Zeitlimit. Für die Zugangsprüfung in
 * hooks.server.js: ohne Limit hängt jeder Seitenaufruf, solange das Backend
 * nicht antwortet, und ein Ausfall ist von einem langsamen Backend nicht zu
 * unterscheiden.
 *
 * @template {any} [T=any]
 * @param {import('graphql-request').RequestDocument} document
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
export function backendProbe(document, timeoutMs = 3000) {
	return /** @type {Promise<T>} */ (
		backendClient().request({ document, signal: AbortSignal.timeout(timeoutMs) })
	);
}

/**
 * Der GraphQL-Endpunkt des Portals: PLEXAMS_PORTAL_SERVER, sonst aus
 * PLEXAMS_SERVER abgeleitet (…/query → …/query/portal). Ein eigener Server im
 * Backend mit eigenem Schema; die Planungs-API ist von dort nicht erreichbar.
 */
export function portalEndpoint() {
	if (env.PLEXAMS_PORTAL_SERVER) return env.PLEXAMS_PORTAL_SERVER;
	return String(env.PLEXAMS_SERVER ?? '').replace(/\/query\/?$/, '/query/portal');
}

/**
 * @param {AuthContext} [ctx]
 */
function portalClient(ctx) {
	const { remoteUser, remoteDisplayname } = ctx ?? authContext.getStore() ?? {};
	/** @type {Record<string, string>} */
	const headers = {};
	if (remoteUser) headers['X-Remote-User'] = remoteUser;
	if (remoteDisplayname) headers['X-Remote-Displayname'] = remoteDisplayname;
	return new GraphQLClient(portalEndpoint(), { headers });
}

/**
 * Eine Anfrage an die Portal-API, mit der Identität des laufenden Requests.
 *
 * @template {any} [T=any]
 * @param {import('graphql-request').RequestDocument} document
 * @param {Record<string, any>} [variables]
 * @returns {Promise<T>}
 */
export function portalRequest(document, variables) {
	return /** @type {Promise<T>} */ (portalClient().request(document, variables));
}

/**
 * Wie portalRequest, mit Zeitlimit – für die Zugangsprüfung.
 *
 * @template {any} [T=any]
 * @param {import('graphql-request').RequestDocument} document
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
export function portalProbe(document, timeoutMs = 3000) {
	return /** @type {Promise<T>} */ (
		portalClient().request({ document, signal: AbortSignal.timeout(timeoutMs) })
	);
}
