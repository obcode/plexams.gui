import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Zustand der StudentRegs (Cache). dirty=true → veraltet (NavBar-Banner).
// Spiegelt das Muster von $lib/assembledExams/store.

/** @typedef {{ dirty: boolean, reason: string | null, changedAt: string | null }} StudentRegsState */

/** @type {import('svelte/store').Writable<StudentRegsState>} */
export const studentRegsState = writable({ dirty: false, reason: null, changedAt: null });

export const regeneratingStudents = writable(false);

let inflight = false;

export async function checkStudentRegs() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/studentRegsState');
		if (!res.ok) return;
		const d = await res.json().catch(() => ({}));
		if (d?.studentRegsState) studentRegsState.set(d.studentRegsState);
	} catch {
		/* ignore */
	} finally {
		inflight = false;
	}
}

/**
 * StudentRegs neu erzeugen (~400ms). Setzt den neuen Zustand und liefert die
 * Anzahl bzw. einen Fehler für die Anzeige.
 * @returns {Promise<{ studentCount: number, error: string | null }>}
 */
export async function regenerateStudentRegs() {
	if (!browser) return { studentCount: 0, error: null };
	regeneratingStudents.set(true);
	try {
		const res = await fetch('/api/generateStudentRegs', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { studentCount: 0, error: d?.error || `Fehler (HTTP ${res.status})` };
		}
		const r = d.generateStudentRegs;
		if (r?.state) studentRegsState.set(r.state);
		return { studentCount: r?.studentCount ?? 0, error: null };
	} catch (e) {
		return { studentCount: 0, error: e instanceof Error ? e.message : String(e) };
	} finally {
		regeneratingStudents.set(false);
	}
}
