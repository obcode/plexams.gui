// Reine Helfer rund um die Jira-Anbindung (ohne Netzwerk — unit-getestet).
// Die Fetch-/Upload-Wrapper liegen in ./client.js.

/**
 * @typedef {{ name?: string|null, displayName?: string|null, emailAddress?: string|null } | null} JiraConnection
 * @typedef {{ key: string, summary?: string|null, description?: string|null, status?: string|null, issueType?: string|null, url?: string|null }} JiraIssue
 */

/**
 * Status-Text und -Flag für das Verbindungs-Badge. `ok=false`, wenn keine
 * Verbindung besteht (null) oder ein Fehler übergeben wurde.
 * @param {JiraConnection} conn
 * @param {string} [error]
 * @returns {{ ok: boolean, text: string }}
 */
export function connectionStatus(conn, error) {
	if (error) return { ok: false, text: 'nicht erreichbar (PAT prüfen)' };
	if (conn && (conn.displayName || conn.name)) {
		return { ok: true, text: `verbunden als ${conn.displayName || conn.name}` };
	}
	return { ok: false, text: 'nicht verbunden' };
}

/**
 * Issue-Key normalisieren (Jira-Keys sind großgeschrieben, z. B. „PLEX-12").
 * @param {string} key
 * @returns {string}
 */
export function normalizeIssueKey(key) {
	return String(key ?? '')
		.trim()
		.toUpperCase();
}

/**
 * Grobe Plausibilitätsprüfung eines Jira-Keys: PROJEKT-NUMMER.
 * @param {string} key
 * @returns {boolean}
 */
export function isValidIssueKey(key) {
	return /^[A-Z][A-Z0-9]*-\d+$/.test(normalizeIssueKey(key));
}
