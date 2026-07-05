import { env } from '$env/dynamic/public';

// Helfer für den serverseitigen E-Mail-Anhang-Speicher.
//
// Binärdateien werden per REST direkt an plexams.go hochgeladen (NICHT über
// GraphQL/den /api-Proxy — multipart-Binärdaten gehören nicht durch den
// GraphQL-Layer). Auflisten/Leeren läuft als GraphQL über die /api-Proxies
// (Konvention: HTTP-GraphQL nie direkt aus dem Browser).
//
// kind: 'cover-page' (key = Lehrer-ID) | 'invigilation-image' (key = Aufsichts-ID)

/** Basis-URL von plexams.go (gleicher Host wie /query, aber ohne /query). */
export function backendBase() {
	const url = env.PUBLIC_PLEXAMS_SERVER || 'http://localhost:8080/query';
	return url.replace(/\/query\/?$/, '');
}

/**
 * @typedef {{ key: string, filename: string, size: number, uploadedAt: string }} Attachment
 */

/**
 * Einzeldatei hochladen (z. B. ein im Browser erzeugtes PNG pro Aufsicht oder
 * ein einzelnes Deckblatt-PDF). `key` ist optional: ohne key leitet der Server
 * ihn aus den End-Ziffern des Dateinamens ab (HTTP 400, wenn das misslingt).
 * @param {{ kind: string, key?: string | number | null, blob: Blob, filename: string }} p
 * @returns {Promise<{ ok: boolean, blocked: boolean, result?: any, error?: string }>}
 */
export async function uploadAttachment({ kind, key, blob, filename }) {
	const fd = new FormData();
	fd.append('kind', kind);
	if (key !== undefined && key !== null && String(key) !== '') fd.append('key', String(key));
	fd.append('file', blob, filename);
	return postUpload(`${backendBase()}/upload/email-attachment`, fd);
}

/**
 * ZIP hochladen; der Server entpackt und leitet den key aus der letzten
 * Ziffernfolge des Dateinamens ab. Dateien ohne Ziffern → `skipped`.
 * @param {{ kind: string, file: File }} p
 * @returns {Promise<{ ok: boolean, blocked: boolean, result?: any, error?: string }>}
 */
export async function uploadAttachmentsZip({ kind, file }) {
	const fd = new FormData();
	fd.append('kind', kind);
	fd.append('file', file);
	return postUpload(`${backendBase()}/upload/email-attachments-zip`, fd);
}

/**
 * Generischer Multipart-Upload an plexams.go (mit 409→blocked-Behandlung).
 * Auch außerhalb der E-Mail-Anhänge nutzbar (z. B. Primuss-ZIP).
 * @param {string} url
 * @param {FormData} fd
 * @returns {Promise<{ ok: boolean, blocked: boolean, result?: any, error?: string }>}
 */
export async function postUpload(url, fd) {
	let res;
	try {
		res = await fetch(url, { method: 'POST', body: fd });
	} catch (e) {
		return { ok: false, blocked: false, error: e instanceof Error ? e.message : String(e) };
	}
	// 409: gerade läuft eine Validierung/ein Transfer/eine Mail → nur Hinweis.
	if (res.status === 409) {
		return { ok: false, blocked: true };
	}
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		return { ok: false, blocked: false, error: `HTTP ${res.status}${text ? `: ${text}` : ''}` };
	}
	const result = await res.json().catch(() => ({}));
	return { ok: true, blocked: false, result };
}

/**
 * Anhänge einer Art auflisten (über den /api-Proxy).
 * @param {string} kind
 * @returns {Promise<Attachment[]>}
 */
export async function listAttachments(kind) {
	const res = await fetch(`/api/email/emailAttachments?kind=${encodeURIComponent(kind)}`);
	if (!res.ok) throw new Error(`Konnte Anhänge nicht laden (HTTP ${res.status})`);
	const data = await res.json();
	return data.emailAttachments ?? [];
}

/**
 * Alle Anhänge einer Art löschen (über den /api-Proxy).
 * @param {string} kind
 * @returns {Promise<void>}
 */
export async function clearAttachments(kind) {
	const res = await fetch('/api/email/clearEmailAttachments', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ kind })
	});
	if (!res.ok) throw new Error(`Konnte Anhänge nicht leeren (HTTP ${res.status})`);
}
