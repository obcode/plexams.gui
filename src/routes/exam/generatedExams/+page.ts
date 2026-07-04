import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// „generierte Prüfungen" → „aufbereitete Prüfungen": alte URL umleiten.
export const load: PageLoad = () => {
	throw redirect(308, '/exam/assembledExams');
};
