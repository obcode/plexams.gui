import { writable, get } from 'svelte/store';

// Session-weiter Probelauf-Empfänger. Ein globaler Store, damit jeder
// „Probelauf"-Button (EmailSender) die aktuelle Adresse anzeigt und ein
// Setzen/Zurücksetzen auf der Probeläufe-Seite überall reaktiv durchschlägt.

/**
 * @typedef {Object} DryRunTestMailStatus
 * @property {string | null} override aktiver Session-Override (oder null = Default)
 * @property {string} current Adresse, an die Probeläufe aktuell gehen
 * @property {string} default konfigurierter Default (Ziel eines Reset)
 * @property {boolean} overridden true, wenn ein abweichender Override aktiv ist
 */

/** @type {import('svelte/store').Writable<DryRunTestMailStatus | null>} */
export const dryRunTestMail = writable(null);

let loaded = false;
/** @type {Promise<DryRunTestMailStatus | null> | null} */
let loading = null;

/**
 * Lädt den aktuellen Probelauf-Empfänger einmalig (danach aus dem Store).
 * @returns {Promise<DryRunTestMailStatus | null>}
 */
export function ensureDryRunTestMail() {
	if (loaded) return Promise.resolve(get(dryRunTestMail));
	if (loading) return loading;
	loading = fetch('/api/email/dryRunTestMail')
		.then((r) => r.json())
		.then((d) => {
			/** @type {DryRunTestMailStatus | null} */
			const status = d?.dryRunTestMail ?? null;
			if (status) {
				dryRunTestMail.set(status);
				loaded = true;
			}
			return status;
		})
		.catch(() => null)
		.finally(() => {
			loading = null;
		});
	return loading;
}

/**
 * Probelauf-Empfänger überschreiben. Leerer String setzt auf den Default zurück.
 * @param {string} email
 * @returns {Promise<DryRunTestMailStatus>}
 */
export async function setDryRunTestMail(email) {
	const res = await fetch('/api/email/setDryRunTestMail', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ email })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || d?.error) throw new Error(d?.error ?? `Fehler (HTTP ${res.status})`);
	dryRunTestMail.set(d.setDryRunTestMail);
	loaded = true;
	return d.setDryRunTestMail;
}

/**
 * Session-Override entfernen → der konfigurierte Default gilt wieder.
 * @returns {Promise<DryRunTestMailStatus>}
 */
export async function resetDryRunTestMail() {
	const res = await fetch('/api/email/resetDryRunTestMail', { method: 'POST' });
	const d = await res.json().catch(() => ({}));
	if (!res.ok || d?.error) throw new Error(d?.error ?? `Fehler (HTTP ${res.status})`);
	dryRunTestMail.set(d.resetDryRunTestMail);
	loaded = true;
	return d.resetDryRunTestMail;
}
