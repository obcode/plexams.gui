import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Gemeinsame, einmalig geladene Nachschlage-Karte ancode → { module, mainExamer }.
// Die Validierungs-Findings tragen nur strukturierte Ancodes; damit reichern die
// ValidatorCards die Ancode-Badges um Modul + Erstprüfer:in an. Fehlt ein Ancode
// (oder scheitert der Fetch), bleibt es bei der reinen Ancode-Anzeige.

/** @typedef {{ module: string, mainExamer: string }} ExamInfo */

/** @type {import('svelte/store').Writable<Map<number, ExamInfo>>} */
export const examInfo = writable(new Map());

let loading = false;
let loaded = false;

/**
 * ancode → { module, mainExamer } einmalig laden (idempotent — mehrfaches
 * Aufrufen, z. B. aus jeder ValidatorCard, löst nur einen Fetch aus).
 */
export async function loadExamInfo() {
	if (!browser || loaded || loading) return;
	loading = true;
	try {
		const res = await fetch('/api/exam/examLookup');
		if (!res.ok) return;
		const data = await res.json();
		/** @type {Map<number, ExamInfo>} */
		const map = new Map();
		for (const e of data?.zpaExams ?? []) {
			map.set(e.ancode, { module: e.module, mainExamer: e.mainExamer });
		}
		examInfo.set(map);
		loaded = true;
	} catch {
		/* Fallback: nur Ancodes anzeigen */
	} finally {
		loading = false;
	}
}
