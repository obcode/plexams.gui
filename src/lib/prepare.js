import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { generatedExamsState } from '$lib/generatedExams/store';
import { studentRegsState } from '$lib/studentRegs/store';

// Vorbereitung in einem Schritt: generierte Prüfungen + StudentRegs zusammen
// erzeugen (generatePreparation). Aktualisiert beide Zustands-Stores.

export const preparing = writable(false);

/**
 * @returns {Promise<{ changes: any[], studentCount: number, error: string | null }>}
 */
export async function regeneratePreparation() {
	if (!browser) return { changes: [], studentCount: 0, error: null };
	preparing.set(true);
	try {
		const res = await fetch('/api/generatePreparation', { method: 'POST' });
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) {
			return { changes: [], studentCount: 0, error: d?.error || `Fehler (HTTP ${res.status})` };
		}
		const r = d.generatePreparation;
		if (r?.generatedExams?.state) generatedExamsState.set(r.generatedExams.state);
		if (r?.studentRegs?.state) studentRegsState.set(r.studentRegs.state);
		return {
			changes: r?.generatedExams?.changes ?? [],
			studentCount: r?.studentRegs?.studentCount ?? 0,
			error: null
		};
	} catch (e) {
		return { changes: [], studentCount: 0, error: e instanceof Error ? e.message : String(e) };
	} finally {
		preparing.set(false);
	}
}
