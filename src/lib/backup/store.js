import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
import { clientErrorMessage } from '#lib/errors/clientErrors.js';
import { statusFailed, statusOk } from '#lib/errors/statusProblems.js';
import { writable } from 'svelte/store';
import { browser } from '$app/env';

// Backup-Status des aktuellen Semesters. hasUnsavedChanges=true → seit der letzten
// Sicherung gab es Mutationen (mutation_log-Einträge); die NavBar weist dann dezent
// auf das fällige Backup hin. lastDumpAt = Zeitpunkt der letzten Sicherung
// (null = noch nie), lastChangeAt = Zeitpunkt der letzten Änderung.
//
// Der Server stempelt lastDumpAt beim Download von /download/my-inputs-csv.zip;
// nach dem Download also checkBackupStatus() aufrufen, dann verschwindet der Hinweis.
//
// Bewusst der CSV-Export und nicht die Gesamtsicherung: die läuft als Cronjob auf dem
// Host (pg_dump über die ganze Datenbank) und könnte diesen Stempel gar nicht setzen.
// Das ist die Sicherung der Maschine — dieser Hinweis richtet sich an den Planer, und
// der CSV-Export ist die Sicherung, die er selbst auslöst.

/**
 * @typedef {{ hasUnsavedChanges: boolean, lastDumpAt: string | null, lastChangeAt: string | null }} BackupStatus
 */

/** @type {import('svelte/store').Writable<BackupStatus>} */
export const backupStatus = writable({
	hasUnsavedChanges: false,
	lastDumpAt: null,
	lastChangeAt: null
});

let inflight = false;
const KEY = 'backup';
const LABEL = 'ob seit der letzten Sicherung etwas geändert wurde';

/** Backup-Status frisch vom Server holen (reine Read-Query, nicht write-gelockt). */
export async function checkBackupStatus() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/backup/status');
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			statusFailed(KEY, LABEL, d?.error || httpErrorMessage(res.status));
			return;
		}
		if (d?.backupStatus) backupStatus.set(d.backupStatus);
		statusOk(KEY);
	} catch (e) {
		statusFailed(KEY, LABEL, clientErrorMessage(e));
	} finally {
		inflight = false;
	}
}
