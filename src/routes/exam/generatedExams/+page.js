import { redirect } from '@sveltejs/kit';

// „generierte Prüfungen" → „aufbereitete Prüfungen": alte URL umleiten.
export function load() {
	throw redirect(308, '/exam/assembledExams');
}
