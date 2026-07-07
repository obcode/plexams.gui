import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Zustand der „aufbereiteten Prüfungen" (Cache). dirty=true → veraltet, der
// NavBar-Banner weist darauf hin. reason = zuletzt invalidierende Operation,
// changedAt = Zeitpunkt (localtime vom Server).

/**
 * @typedef {{ dirty: boolean, reason: string | null, changedAt: string | null }} GeneratedExamsState
 */

/** @type {import('svelte/store').Writable<GeneratedExamsState>} */
export const assembledExamsState = writable({ dirty: false, reason: null, changedAt: null });

export const regeneratingAssembled = writable(false);
export const resettingAssembled = writable(false);

let inflight = false;

/** Zustand frisch vom Server holen. */
export async function checkAssembledExams() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/exam/assembledExamsState');
		if (!res.ok) return;
		const d = await res.json().catch(() => ({}));
		if (d?.assembledExamsState) assembledExamsState.set(d.assembledExamsState);
	} catch {
		/* ignore */
	} finally {
		inflight = false;
	}
}

/**
 * Aufbereitete Prüfungen neu erzeugen (schnell). Setzt den neuen Zustand und
 * liefert die Änderungsliste bzw. einen Fehler für die Anzeige.
 * @returns {Promise<{ changes: any[], error: string | null }>}
 */
export async function regenerateAssembledExams() {
	if (!browser) return { changes: [], error: null };
	regeneratingAssembled.set(true);
	try {
		const res = await fetch('/api/exam/generateAssembledExams', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { changes: [], error: d?.error || `Fehler (HTTP ${res.status})` };
		}
		const r = d.generateAssembledExams;
		if (r?.state) assembledExamsState.set(r.state);
		return { changes: r?.changes ?? [], error: null };
	} catch (e) {
		return { changes: [], error: e instanceof Error ? e.message : String(e) };
	} finally {
		regeneratingAssembled.set(false);
	}
}

/**
 * Gecachte aufbereitete Prüfungen löschen (destruktiv). Liefert die Anzahl der
 * entfernten Prüfungen bzw. einen Fehler. Danach ist der Cache leer; Aufrufer
 * sollten checkAssembledExams() (Zustand neu holen) und die Views neu laden.
 * @returns {Promise<{ removed: number, error: string | null }>}
 */
export async function resetAssembledExams() {
	if (!browser) return { removed: 0, error: null };
	resettingAssembled.set(true);
	try {
		const res = await fetch('/api/exam/resetAssembledExams', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { removed: 0, error: d?.error || `Fehler (HTTP ${res.status})` };
		}
		return { removed: d.resetAssembledExams ?? 0, error: null };
	} catch (e) {
		return { removed: 0, error: e instanceof Error ? e.message : String(e) };
	} finally {
		resettingAssembled.set(false);
	}
}
