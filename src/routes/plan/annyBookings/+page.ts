import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Anny-Buchungen liegen jetzt in der Räume-Domäne. Alte URL umleiten.
export const load: PageLoad = () => {
	throw redirect(308, '/rooms/annyBookings');
};
