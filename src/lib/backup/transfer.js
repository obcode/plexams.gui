import { backendBase } from '$lib/backend.js';

// Sichern/Wiederherstellen von Semesterdaten über die REST-Routen von plexams.go
// (kein GraphQL). Zwei Ebenen:
//   • kompletter Semester-Dump (ZIP)  – /download/semester-dump.zip, /upload/semester-dump.zip
//   • einzelne Datensätze (JSON)      – /download/dataset?name=…, /upload/dataset
//
// Anders als bei den E-Mail-Anhängen (postUpload) wird der Fehlertext auch bei
// HTTP 409 durchgereicht: der Server nennt dort die blockierende Collection bzw.
// „read-only" — das soll der Nutzer sehen.

/**
 * Download-URL für einen einzelnen Datensatz (JSON, Content-Disposition gesetzt).
 * @param {string} name
 * @returns {string}
 */
export function datasetDownloadUrl(name) {
	return `${backendBase()}/download/dataset?name=${encodeURIComponent(name)}`;
}

/**
 * Download-URL für den kompletten Semester-Dump (ZIP, Content-Disposition gesetzt).
 * @returns {string}
 */
export function semesterDumpDownloadUrl() {
	return `${backendBase()}/download/semester-dump.zip`;
}

/**
 * @typedef {{ restored?: Record<string, number>, total?: number }} RestoreResult
 * @typedef {{ ok: true, result: RestoreResult } | { ok: false, status: number, error: string }} TransferResult
 */

/**
 * Einen einzelnen Datensatz hochladen. Überschreibt nur diesen Datensatz, nicht
 * den übrigen Plan.
 * @param {string} name
 * @param {File} file
 * @returns {Promise<TransferResult>}
 */
export async function uploadDataset(name, file) {
	const fd = new FormData();
	fd.append('name', name);
	fd.append('file', file);
	return postTransfer(`${backendBase()}/upload/dataset`, fd);
}

/**
 * Kompletten Semester-Dump wiederherstellen. Nur in eine frische Workspace-DB
 * sinnvoll (Server blockt mit 409, wenn die DB nicht leer bzw. read-only ist).
 * @param {File} file
 * @returns {Promise<TransferResult>}
 */
export async function restoreSemesterDump(file) {
	const fd = new FormData();
	fd.append('file', file);
	return postTransfer(`${backendBase()}/upload/semester-dump.zip`, fd);
}

/**
 * Multipart-POST an plexams.go mit einheitlicher Fehlerbehandlung.
 * @param {string} url
 * @param {FormData} fd
 * @returns {Promise<TransferResult>}
 */
export async function postTransfer(url, fd) {
	let res;
	try {
		res = await fetch(url, { method: 'POST', body: fd });
	} catch (e) {
		return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
	}
	return interpretTransferResponse(res);
}

/**
 * Antwort einer Transfer-Route auswerten. Bei Erfolg das JSON (restored/total),
 * sonst den Fehlertext des Servers (auch für 400/409). Strukturell typisiert,
 * damit auch ein Response-Stub aus den Tests passt.
 * @param {{ ok: boolean, status: number, json: () => Promise<any>, text: () => Promise<string> }} res
 * @returns {Promise<TransferResult>}
 */
export async function interpretTransferResponse(res) {
	if (res.ok) {
		const result = await res.json().catch(() => ({}));
		return { ok: true, result };
	}
	const text = await res.text().catch(() => '');
	return { ok: false, status: res.status, error: text.trim() || `HTTP ${res.status}` };
}
