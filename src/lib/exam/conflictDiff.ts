// Diff-Status eines Konflikts nach einem (Probe-)Lauf des Terminplan-Generators.
// Das Backend liefert einen freien String (Feld ExamScheduleConflict.diffStatus);
// wir mappen ihn defensiv (case-insensitiv, deutsch + englisch) auf die Anzeige.
// Reine Funktion — bewusst aus der .svelte-Komponente extrahiert, damit sie
// unit-testbar ist.

import type { ExamScheduleConflict } from '$lib/gql/types';

export type DiffMeta = {
	/** Hintergrund-Tönung der Zeile (daisyUI/Theme-Token) */
	row: string;
	/** Badge-Klasse */
	badge: string;
	/** Badge-Text */
	label: string;
};

/**
 * Mappt einen `diffStatus` auf Anzeige-Metadaten.
 * @returns Metadaten für „neu/schlimmer/besser" oder `null` für unverändert/kein Diff.
 */
// Param bewusst defensiver als das Schema (das diffStatus als String! führt):
// die Funktion soll auch null/undefined/Leerstring robust abfangen.
export function diffMeta(status?: ExamScheduleConflict['diffStatus'] | null): DiffMeta | null {
	const n = (status ?? '').trim().toLowerCase();
	if (n === 'new' || n === 'neu') {
		return { row: 'bg-error/10', badge: 'badge-error', label: 'neu' };
	}
	if (n === 'worse' || n === 'schlimmer' || n === 'increased') {
		return { row: 'bg-warning/10', badge: 'badge-warning', label: '↑ schlimmer' };
	}
	if (n === 'better' || n === 'besser' || n === 'decreased') {
		return { row: 'bg-success/10', badge: 'badge-success', label: '↓ besser' };
	}
	return null; // unverändert / kein Diff → neutral
}
