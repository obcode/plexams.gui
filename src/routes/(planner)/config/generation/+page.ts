import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Einteilungs-Parameter sind jetzt direkt auf der Einteilungs-Seite
// (aufklappbarer Block „Erweiterte Parameter"). Alte URL umleiten.
export const load: PageLoad = () => {
	throw redirect(308, '/plan/invigilation/generate');
};
