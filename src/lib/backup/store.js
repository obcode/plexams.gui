import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Backup-/Dump-Status des aktuellen Semesters. hasUnsavedChanges=true → seit dem
// letzten Semester-Dump gab es Mutationen (mutation_log-Einträge); die NavBar
// weist dann dezent auf das fällige Backup hin. lastDumpAt = Zeitpunkt des
// letzten Dumps (null = noch nie), lastChangeAt = Zeitpunkt der letzten Änderung.
//
// Der Server stempelt lastDumpAt beim Download von /download/semester-dump.zip;
// nach dem Download also refetchStatus() aufrufen, dann verschwindet der Hinweis.

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
