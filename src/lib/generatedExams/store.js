import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Zustand der „generierten Prüfungen" (Cache). dirty=true → veraltet, der
// NavBar-Banner weist darauf hin. reason = zuletzt invalidierende Operation,
// changedAt = Zeitpunkt (localtime vom Server).

/**
 * @typedef {{ dirty: boolean, reason: string | null, changedAt: string | null }} GeneratedExamsState
 */

/** @type {import('svelte/store').Writable<GeneratedExamsState>} */
export const generatedExamsState = writable({ dirty: false, reason: null, changedAt: null });

export const regenerating = writable(false);

let inflight = false;

/** Zustand frisch vom Server holen. */
export async function checkGeneratedExams() {
	if (!browser || inflight) return;
	inflight = true;
	try {
		const res = await fetch('/api/generatedExamsState');
		if (!res.ok) return;
		const d = await res.json().catch(() => ({}));
		if (d?.assembledExamsState) generatedExamsState.set(d.assembledExamsState);
	} catch {
		/* ignore */
	} finally {
		inflight = false;
	}
}

/**
 * Generierte Prüfungen neu erzeugen (schnell). Setzt den neuen Zustand und
 * liefert die Änderungsliste bzw. einen Fehler für die Anzeige.
 * @returns {Promise<{ changes: any[], error: string | null }>}
 */
export async function regenerateGeneratedExams() {
	if (!browser) return { changes: [], error: null };
	regenerating.set(true);
	try {
		const res = await fetch('/api/generateGeneratedExams', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { changes: [], error: d?.error || `Fehler (HTTP ${res.status})` };
		}
		const r = d.generateAssembledExams;
		if (r?.state) generatedExamsState.set(r.state);
		return { changes: r?.changes ?? [], error: null };
	} catch (e) {
		return { changes: [], error: e instanceof Error ? e.message : String(e) };
	} finally {
		regenerating.set(false);
	}
}
