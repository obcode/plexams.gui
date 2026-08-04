import { writable } from 'svelte/store';
import { browser } from '$app/environment';

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

/** Backup-Status frisch vom Server holen (reine Read-Query, nicht write-gelockt). */
export async function checkBackupStatus() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/backup/status');
		if (!res.ok) return;
		const d = await res.json().catch(() => ({}));
		if (d?.backupStatus) backupStatus.set(d.backupStatus);
	} catch {
		/* ignore */
	} finally {
		inflight = false;
	}
}
