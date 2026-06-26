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
		if (d?.generatedExamsState) generatedExamsState.set(d.generatedExamsState);
	} catch {
		/* ignore */
	} finally {
		inflight = false;
	}
}

/** Generierte Prüfungen neu erzeugen (schnell). Liefert den neuen Zustand. */
export async function regenerateGeneratedExams() {
	if (!browser) return;
	regenerating.set(true);
	try {
		const res = await fetch('/api/generateGeneratedExams', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (d?.generateGeneratedExams) generatedExamsState.set(d.generateGeneratedExams);
		else await checkGeneratedExams();
	} catch {
		await checkGeneratedExams();
	} finally {
		regenerating.set(false);
	}
}
