import { clientErrorMessage } from '#lib/errors/clientErrors.js';
import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
import { statusFailed, statusOk } from '#lib/errors/statusProblems.js';
import { writable } from 'svelte/store';
import { browser } from '$app/env';

// Zustand der StudentRegs (Cache). dirty=true → veraltet (NavBar-Banner).
// Spiegelt das Muster von #lib/assembledExams/store.

/** @typedef {{ dirty: boolean, reason: string | null, changedAt: string | null }} StudentRegsState */

/** @type {import('svelte/store').Writable<StudentRegsState>} */
export const studentRegsState = writable({ dirty: false, reason: null, changedAt: null });

export const regeneratingStudents = writable(false);

let inflight = false;
const KEY = 'studentRegs';
const LABEL = 'ob die Anmeldungen aktuell sind';

export async function checkStudentRegs() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/primuss/studentRegsState');
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			statusFailed(KEY, LABEL, d?.error || httpErrorMessage(res.status));
			return;
		}
		if (d?.studentRegsState) studentRegsState.set(d.studentRegsState);
		statusOk(KEY);
	} catch (e) {
		statusFailed(KEY, LABEL, clientErrorMessage(e));
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
		const res = await fetch('/api/primuss/generateStudentRegs', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { studentCount: 0, error: d?.error || httpErrorMessage(res.status) };
		}
		const r = d.generateStudentRegs;
		if (r?.state) studentRegsState.set(r.state);
		return { studentCount: r?.studentCount ?? 0, error: null };
	} catch (e) {
		return { studentCount: 0, error: clientErrorMessage(e) };
	} finally {
		regeneratingStudents.set(false);
	}
}
