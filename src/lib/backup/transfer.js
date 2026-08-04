import { backendBase } from '$lib/backend.js';

// Sichern/Wiederherstellen von Semesterdaten über die REST-Routen von plexams.go
// (kein GraphQL):
//   • einzelne Datensätze (CSV)      – /download/dataset-csv?name=…, /upload/dataset-csv
//                                      plus /download/my-inputs-csv.zip (alle als CSV)
//
// Der komplette Semester-Dump (ZIP) und die JSON-Datensätze sind mit der
// MongoDB-Schicht entfallen: beide lasen Collections als rohe Dokumente. Die
// CSV-Ebene deckt dieselben Datensätze typisiert ab; die Gesamtsicherung kommt
// als pg_dump zurück.
//
// Anders als bei den E-Mail-Anhängen (postUpload) wird der Fehlertext auch bei
// HTTP 409 durchgereicht: der Server nennt dort die blockierende Collection bzw.
// „read-only" — das soll der Nutzer sehen.

/**
 * Download-URL für einen einzelnen Datensatz als CSV (Content-Disposition gesetzt).
 * @param {string} name
 * @returns {string}
 */
export function datasetCsvDownloadUrl(name) {
	return `${backendBase()}/download/dataset-csv?name=${encodeURIComponent(name)}`;
}

/**
 * Download-URL für alle eigenen Eingaben als ZIP mit je einer CSV pro Datensatz.
 * @returns {string}
 */
export function myInputsCsvDownloadUrl() {
	return `${backendBase()}/download/my-inputs-csv.zip`;
}

/**
 * @typedef {{ dataset?: string, applied?: number, skipped?: string[] }} CsvImportResult
 * @typedef {{ ok: true, result: any } | { ok: false, status: number, error: string }} TransferResult
 */

/**
 * Einen einzelnen Datensatz als CSV hochladen. Aktualisiert/ergänzt pro Zeile
 * (Ausnahme room-requests = Voll-Ersatz). Erfolg: { dataset, applied, skipped }.
 * @param {string} name
 * @param {File} file
 * @returns {Promise<TransferResult>}
 */
export async function uploadDatasetCsv(name, file) {
	const fd = new FormData();
	fd.append('name', name);
	fd.append('file', file);
	return postTransfer(`${backendBase()}/upload/dataset-csv`, fd);
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
