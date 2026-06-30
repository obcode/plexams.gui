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

let inflight = false;

/** Zustand frisch vom Server holen. */
export async function checkAssembledExams() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/assembledExamsState');
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
		const res = await fetch('/api/generateAssembledExams', { method: 'POST' });
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
