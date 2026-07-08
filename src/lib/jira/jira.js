// Reine Helfer rund um die Jira-Anbindung (ohne Netzwerk — unit-getestet).
// Die Fetch-/Upload-Wrapper liegen in ./client.js.

/**
 * @typedef {{ name?: string|null, displayName?: string|null, emailAddress?: string|null }} JiraUser
 * @typedef {JiraUser | null} JiraConnection
 * @typedef {{ author?: JiraUser|null, body?: string|null, created?: string|null }} JiraComment
 * @typedef {{ key: string, summary?: string|null, description?: string|null, status?: string|null, issueType?: string|null, url?: string|null, reporter?: JiraUser|null, created?: string|null, comments?: JiraComment[]|null }} JiraIssue
 * @typedef {{ requestType: string, issues: JiraIssue[] }} JiraRequestTypeGroup
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

// Die Prüfungsplanung nutzt genau ein Jira-Projekt; alle Keys sind FK07PP-<n>.
// Deshalb reicht im Editor die reine Nummer als Eingabe.
export const DEFAULT_JIRA_PROJECT = 'FK07PP';

/**
 * Issue-Key normalisieren (Jira-Keys sind großgeschrieben, z. B. „FK07PP-12").
 * @param {string} key
 * @returns {string}
 */
export function normalizeIssueKey(key) {
	return String(key ?? '')
		.trim()
		.toUpperCase();
}

/**
 * Eingabe zu einem vollständigen Issue-Key machen: eine reine Zahl wird als
 * Nummer im Standard-Projekt gedeutet („123" → „FK07PP-123"); ein bereits
 * vollständiger Key (mit Projekt-Präfix) bleibt unverändert.
 * @param {string} input
 * @param {string} [project]
 * @returns {string}
 */
export function resolveIssueKey(input, project = DEFAULT_JIRA_PROJECT) {
	const norm = normalizeIssueKey(input);
	return /^\d+$/.test(norm) ? `${project}-${norm}` : norm;
}

/**
 * Grobe Plausibilitätsprüfung eines Jira-Keys: PROJEKT-NUMMER.
 * @param {string} key
 * @returns {boolean}
 */
export function isValidIssueKey(key) {
	return /^[A-Z][A-Z0-9]*-\d+$/.test(normalizeIssueKey(key));
}

/**
 * Flache Issue-Liste nach Issue-Type gruppieren (für die „nach Typ"-Sicht —
 * die flache Liste trägt issueType schon, ein extra Backend-Call entfällt).
 * Reihenfolge: größte Gruppe zuerst, bei Gleichstand alphabetisch (stabil).
 * @param {JiraIssue[]} issues
 * @returns {{ issueType: string, issues: JiraIssue[] }[]}
 */
export function groupByIssueType(issues) {
	/** @type {Map<string, JiraIssue[]>} */
	const map = new Map();
	for (const it of issues ?? []) {
		const t = it.issueType || '—';
		const group = map.get(t) ?? map.set(t, []).get(t);
		group?.push(it);
	}
	return [...map.entries()]
		.map(([issueType, group]) => ({ issueType, issues: group }))
		.sort((a, b) => b.issues.length - a.issues.length || a.issueType.localeCompare(b.issueType));
}

/**
 * Time-Scalar → lesbares deutsches Datum (Europe/Berlin). Leere/ungültige
 * Werte ergeben '' (z. B. weil die Listen-Queries created nicht befüllen).
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatJiraDate(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleString('de-DE', {
		timeZone: 'Europe/Berlin',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
