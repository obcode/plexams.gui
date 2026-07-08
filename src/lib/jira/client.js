// Browser-seitige Zugriffe auf die Jira-Anbindung.
//
// GraphQL läuft über die /api/jira-Proxies (Konvention: HTTP-GraphQL nie direkt
// aus dem Browser). Der Datei-Anhang geht als multipart DIREKT an plexams.go
// (/upload/jira-attachment) — Binärdaten gehören nicht durch den GraphQL-Layer.

import { backendBase } from '$lib/backend.js';
import { postUpload } from '$lib/email/attachments.js';

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
async function apiGet(path) {
	const res = await fetch(path);
	const data = await res.json().catch(() => ({}));
	if (!res.ok || data?.error) throw new Error(data?.error || `Fehler (HTTP ${res.status})`);
	return data;
}

/**
 * @param {string} path
 * @param {Record<string, any>} body
 * @returns {Promise<any>}
 */
async function apiPost(path, body) {
	const res = await fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok || data?.error) throw new Error(data?.error || `Fehler (HTTP ${res.status})`);
	return data;
}

/** Verbindungstest. @returns {Promise<import('./jira.js').JiraConnection>} */
export const fetchConnection = () =>
	apiGet('/api/jira/connection').then((d) => d.jiraConnection ?? null);

/**
 * Offene Issues neu laden (flache Liste + Gruppierung nach Anfragetyp).
 * @returns {Promise<{ openIssues: import('./jira.js').JiraIssue[], byRequestType: import('./jira.js').JiraRequestTypeGroup[] }>}
 */
export const fetchOpenIssues = () =>
	apiGet('/api/jira/openIssues').then((d) => ({
		openIssues: d.jiraOpenIssues ?? [],
		byRequestType: d.jiraOpenIssuesByRequestType ?? []
	}));

/** @param {string} key @returns {Promise<import('./jira.js').JiraIssue | null>} */
export const fetchIssue = (key) =>
	apiGet(`/api/jira/issue?key=${encodeURIComponent(key)}`).then((d) => d.jiraIssue ?? null);

/** @param {string} key @returns {Promise<{ id: string, name: string }[]>} */
export const fetchTransitions = (key) =>
	apiGet(`/api/jira/transitions?key=${encodeURIComponent(key)}`).then(
		(d) => d.jiraTransitions ?? []
	);

/**
 * @param {{ project?: string, issueType?: string, summary: string, description?: string }} payload
 * @returns {Promise<import('./jira.js').JiraIssue>}
 */
export const createIssue = (payload) =>
	apiPost('/api/jira/createIssue', payload).then((d) => d.createJiraIssue);

/** @param {string} key @param {string} body @returns {Promise<boolean>} */
export const addComment = (key, body) =>
	apiPost('/api/jira/addComment', { key, body }).then((d) => d.addJiraComment === true);

/** @param {string} key @param {string} transitionId @returns {Promise<boolean>} */
export const runTransition = (key, transitionId) =>
	apiPost('/api/jira/transition', { key, transitionId }).then(
		(d) => d.transitionJiraIssue === true
	);

/**
 * Eine Datei (z. B. ein generiertes PDF/CSV) direkt an ein Issue hängen.
 * @param {{ key: string, file: File }} p
 * @returns {Promise<{ ok: boolean, blocked: boolean, result?: any, error?: string }>}
 */
export async function attachToIssue({ key, file }) {
	const fd = new FormData();
	fd.append('key', key);
	fd.append('file', file);
	return postUpload(`${backendBase()}/upload/jira-attachment`, fd);
}
