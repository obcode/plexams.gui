import { clientErrorMessage } from '#lib/errors/clientErrors.js';
import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
import { writable } from 'svelte/store';
import { browser } from '$app/env';
import { assembledExamsState } from '#lib/assembledExams/store.js';
import { studentRegsState } from '#lib/studentRegs/store.js';

// Vorbereitung in einem Schritt: aufbereitete Prüfungen + StudentRegs zusammen
// erzeugen (generatePreparation). Aktualisiert beide Zustands-Stores.

export const preparing = writable(false);

/**
 * @returns {Promise<{ changes: any[], studentCount: number, error: string | null }>}
 */
export async function regeneratePreparation() {
	if (!browser) return { changes: [], studentCount: 0, error: null };
	preparing.set(true);
	try {
		const res = await fetch('/api/exam/generatePreparation', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { changes: [], studentCount: 0, error: d?.error || httpErrorMessage(res.status) };
		}
		const r = d.generatePreparation;
		if (r?.assembledExams?.state) assembledExamsState.set(r.assembledExams.state);
		if (r?.studentRegs?.state) studentRegsState.set(r.studentRegs.state);
		return {
			changes: r?.assembledExams?.changes ?? [],
			studentCount: r?.studentRegs?.studentCount ?? 0,
			error: null
		};
	} catch (e) {
		return { changes: [], studentCount: 0, error: clientErrorMessage(e) };
	} finally {
		preparing.set(false);
	}
}
