import { redirect } from '@sveltejs/kit';

// Einteilungs-Parameter sind jetzt direkt auf der Einteilungs-Seite
// (aufklappbarer Block „Erweiterte Parameter"). Alte URL umleiten.
export function load() {
	throw redirect(308, '/plan/invigilation/generate');
}
