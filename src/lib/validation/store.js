import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { validationGroups } from '$lib/validation/validators';
import { getWsClient } from '$lib/validation/wsClient';

// Geteilter Validierungs-Status pro Gruppe. Wird gespeist von den
// Validierungsseiten (über ValidationGroup mit storeId) und von der
// headless "jetzt prüfen"-Funktion der Nav. In localStorage gespiegelt,
// damit der Nav-Indikator einen Reload übersteht (mit Stale-Anzeige).

/**
 * @typedef {{ errors: number, warnings: number, running: boolean, done: boolean, ok: boolean, ts: number | null }} GroupStatus
 */

const KEY = 'plexams.validationStatus';

/** @returns {Record<string, GroupStatus>} */
function load() {
	if (!browser) return {};
	try {
		const s = JSON.parse(localStorage.getItem(KEY) || '{}');
		// nach einem Reload läuft nichts mehr — hängengebliebene Flags zurücksetzen
		for (const k in s) s[k].running = false;
		return s;
	} catch {
		return {};
	}
}

/** @type {import('svelte/store').Writable<Record<string, GroupStatus>>} */
export const validationStore = writable(load());

if (browser) {
	validationStore.subscribe((s) => {
		try {
			localStorage.setItem(KEY, JSON.stringify(s));
		} catch {
			/* ignore */
		}
	});
}

/**
 * Status einer Gruppe setzen. Zeitstempel wird nur beim Abschluss (done)
 * aktualisiert, damit "zuletzt geprüft" stimmt.
 * @param {string} id
 * @param {{ errors: number, warnings: number, running: boolean, done: boolean, ok: boolean }} stats
 */
export function setGroupStats(id, stats) {
	validationStore.update((s) => {
		const prev = s[id];
		const ts = stats.done ? Date.now() : (prev?.ts ?? null);
		return { ...s, [id]: { ...stats, ts } };
	});
}

// Aggregierter Status für die Nav-Ampel.
export const validationSummary = derived(validationStore, ($s) => {
	const entries = validationGroups.map((g) => $s[g.id]).filter(Boolean);
	const doneEntries = entries.filter((e) => e.done);
	const running = entries.some((e) => e.running);
	const errors = doneEntries.reduce((a, e) => a + (e.errors ?? 0), 0);
	const warnings = doneEntries.reduce((a, e) => a + (e.warnings ?? 0), 0);

	/** @type {'unknown' | 'ok' | 'warning' | 'error'} */
	let level = 'unknown';
	if (doneEntries.length > 0) {
		if (errors > 0) level = 'error';
		else if (warnings > 0) level = 'warning';
		else level = 'ok';
	}

	const ts = doneEntries.length ? Math.min(...doneEntries.map((e) => e.ts ?? 0)) : null;
	const partial = doneEntries.length < validationGroups.length;

	return { level, errors, warnings, running, ts, partial };
});

/**
 * Headless einmalige Prüfung aller Gruppen (ohne Terminal-Rendering).
 * Speist nur den Store — für den "jetzt prüfen"-Klick in der Nav.
 */
export async function runValidationCheck() {
	let client;
	try {
		client = await getWsClient();
	} catch {
		return;
	}
	for (const group of validationGroups) runGroupCheck(client, group);
}

/**
 * @param {any} client
 * @param {import('$lib/validation/validators').ValidatorGroup} group
 */
function runGroupCheck(client, group) {
	/** @type {Record<string, { ok: boolean, errorCount: number, warningCount: number }>} */
	const reports = {};
	let remaining = group.validators.length;

	const flush = () => {
		const vals = Object.values(reports);
		setGroupStats(group.id, {
			errors: vals.reduce((a, r) => a + (r.errorCount ?? 0), 0),
			warnings: vals.reduce((a, r) => a + (r.warningCount ?? 0), 0),
			running: remaining > 0,
			done: remaining === 0,
			ok: remaining === 0 && vals.length > 0 && vals.every((r) => r.ok)
		});
	};

	setGroupStats(group.id, { errors: 0, warnings: 0, running: true, done: false, ok: false });

	for (const v of group.validators) {
		const query = `subscription { ${v.key} { level validation { ok errorCount warningCount } } }`;
		const finish = () => {
			remaining = Math.max(0, remaining - 1);
			flush();
		};
		client.subscribe(
			{ query },
			{
				/** @param {any} msg */
				next: (msg) => {
					const line = msg.data && msg.data[v.key];
					if (line && line.validation) reports[v.key] = line.validation;
				},
				error: finish,
				complete: finish
			}
		);
	}
}
