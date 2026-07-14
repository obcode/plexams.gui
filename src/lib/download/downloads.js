import { backendBase } from '$lib/backend.js';

// Download-Links auf die REST-Routen von plexams.go (kein GraphQL). Der Server
// setzt jeweils Content-Disposition (attachment) und streamt die Datei:
//   • GET /download/pdf/{kind}      – PDF (draft-si: ZIP mehrerer PDFs)
//   • GET /download/csv/{kind}      – CSV (kind=draft braucht ?program=<XX>)
//   • GET /download/ics/{program}   – Kalender (ICS) pro Studiengang
// Bei unbekanntem kind bzw. fehlendem program antwortet der Server mit HTTP 400
// und einem Klartext-Body — die <a href>-Links reichen das dem Browser durch.

/**
 * Download-URL für ein PDF (bzw. ZIP bei draft-si).
 * @param {string} kind
 * @returns {string}
 */
export function pdfDownloadUrl(kind) {
	return `${backendBase()}/download/pdf/${encodeURIComponent(kind)}`;
}

/**
 * Download-URL für eine CSV. kind=draft benötigt ein Programm (Studiengang);
 * ohne program liefert der Server HTTP 400.
 * @param {string} kind
 * @param {string} [program]
 * @returns {string}
 */
export function csvDownloadUrl(kind, program) {
	const url = `${backendBase()}/download/csv/${encodeURIComponent(kind)}`;
	return program ? `${url}?program=${encodeURIComponent(program)}` : url;
}

/**
 * Download-URL für den ICS-Kalender eines Studiengangs.
 * @param {string} program
 * @returns {string}
 */
export function icsDownloadUrl(program) {
	return `${backendBase()}/download/ics/${encodeURIComponent(program)}`;
}

/**
 * Download-URL für den vollständigen Semester-Dump (ZIP, Sicherung/Backup). Der
 * Server stempelt beim Ausliefern lastDumpAt (→ backupStatus danach refetchen).
 * @returns {string}
 */
export function semesterDumpUrl() {
	return `${backendBase()}/download/semester-dump.zip`;
}

/**
 * @typedef {{ kind: string, label: string, format: 'pdf' | 'zip', group: 'list' | 'draft' }} PdfDownload
 * @typedef {{ kind: string, label: string, needsProgram?: boolean }} CsvDownload
 */

/**
 * Alle PDF-Downloads. `group` trennt allgemeine Listen von den Plan-Entwürfen;
 * `format` unterscheidet Einzel-PDF von der draft-si-ZIP.
 * @type {PdfDownload[]}
 */
export const PDF_DOWNLOADS = [
	{ kind: 'exams-to-plan', label: 'Prüfungen zum Planen', format: 'pdf', group: 'list' },
	{ kind: 'same-module-name', label: 'Gleiche Modulnamen', format: 'pdf', group: 'list' },
	{ kind: 'constraints', label: 'Constraints', format: 'pdf', group: 'list' },
	{ kind: 'draft-muc.dai', label: 'Entwurf MUC.DAI', format: 'pdf', group: 'draft' },
	{ kind: 'draft-fk08', label: 'Entwurf FK08', format: 'pdf', group: 'draft' },
	{ kind: 'draft-fk10', label: 'Entwurf FK10', format: 'pdf', group: 'draft' },
	{ kind: 'draft-exahm', label: 'Entwurf EXaHM', format: 'pdf', group: 'draft' },
	{ kind: 'draft-fs', label: 'Entwurf FS', format: 'pdf', group: 'draft' },
	{ kind: 'draft-lba-rep', label: 'Entwurf LBA-Wiederholung', format: 'pdf', group: 'draft' },
	{ kind: 'draft-si', label: 'Entwurf SI', format: 'zip', group: 'draft' }
];

/**
 * Alle CSV-Downloads. kind=draft braucht einen Studiengang (needsProgram).
 * @type {CsvDownload[]}
 */
export const CSV_DOWNLOADS = [
	{ kind: 'draft', label: 'Entwurf (pro Studiengang)', needsProgram: true },
	{ kind: 'exahm', label: 'EXaHM', needsProgram: false },
	{ kind: 'lba-repeater', label: 'LBA-Wiederholer', needsProgram: false }
];
