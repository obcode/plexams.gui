import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// „Prüfungen anderer FKs" liegt jetzt in der exam-Domäne. Alte URL umleiten.
export const load: PageLoad = () => {
	throw redirect(308, '/exam/external');
};
