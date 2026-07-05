import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { validationGroups, zpaGroup } from '$lib/validation/validators';
import { getWsClient } from '$lib/validation/wsClient';

// Geteilter Validierungs-Status pro Gruppe. Wird gespeist von den
// Validierungsseiten (über ValidationGroup mit storeId) und von der
// headless "jetzt prüfen"-Funktion der Nav. In localStorage gespiegelt,
// damit der Nav-Indikator einen Reload übersteht (mit Stale-Anzeige).

/**
 * @typedef {{ errors: number, warnings: number, running: boolean, done: boolean, ok: boolean, skipped?: boolean, ts: number | null }} GroupStatus
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
 * @param {{ errors: number, warnings: number, running: boolean, done: boolean, ok: boolean, skipped?: boolean }} stats
 */
export function setGroupStats(id, stats) {
	validationStore.update((s) => {
		const prev = s[id];
		const ts = stats.done ? Date.now() : (prev?.ts ?? null);
		return { ...s, [id]: { ...stats, ts } };
	});
}

/**
 * Aggregiert eine Menge von Gruppen-Status zu einer Ampel.
 * @param {(GroupStatus | undefined)[]} raw
 * @param {number} expected Anzahl erwarteter Gruppen (für "unvollständig")
 */
function summarize(raw, expected) {
	const entries = /** @type {any[]} */ (raw.filter(Boolean));
	const doneEntries = entries.filter((e) => e.done);
	const running = entries.some((e) => e.running);
	const errors = doneEntries.reduce((a, e) => a + (e.errors ?? 0), 0);
	const warnings = doneEntries.reduce((a, e) => a + (e.warnings ?? 0), 0);

	/** @type {'unknown' | 'ok' | 'warning' | 'error' | 'skipped'} */
	let level = 'unknown';
	if (doneEntries.length > 0) {
		if (errors > 0) level = 'error';
		else if (warnings > 0) level = 'warning';
		// nur „übersprungen", wenn alle fertigen Gruppen komplett übersprungen wurden
		// (sonst überwiegt ein echtes ✓ der nicht-übersprungenen Gruppe).
		else if (doneEntries.every((e) => e.skipped)) level = 'skipped';
		else level = 'ok';
	}

	const ts = doneEntries.length ? Math.min(...doneEntries.map((e) => e.ts ?? 0)) : null;
	const partial = doneEntries.length < expected;

	return { level, errors, warnings, running, ts, partial };
}

// Aggregierter Status für die allgemeine Nav-Ampel (Räume + Aufsichten).
export const validationSummary = derived(validationStore, ($s) =>
	summarize(
		validationGroups.map((g) => $s[g.id]),
		validationGroups.length
	)
);

// Pro-Gruppe-Status in fester Reihenfolge (für die drei Punkte in der Nav).
export const validationDots = derived(validationStore, ($s) =>
	validationGroups.map((g) => ({ id: g.id, title: g.title, ...summarize([$s[g.id]], 1) }))
);

// Eigene Ampel nur für die ZPA-Validierungen (separat von der allgemeinen).
export const zpaSummary = derived(validationStore, ($s) => summarize([$s[zpaGroup.id]], 1));

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
 * Headless einmalige Prüfung nur der ZPA-Validatoren (eigene Ampel).
 */
export async function runZpaCheck() {
	let client;
	try {
		client = await getWsClient();
	} catch {
		return;
	}
	runGroupCheck(client, zpaGroup);
}

/**
 * @param {any} client
 * @param {import('$lib/validation/validators').ValidatorGroup} group
 */
function runGroupCheck(client, group) {
	/** @type {Record<string, { ok: boolean, errorCount: number, warningCount: number, skipped?: boolean }>} */
	const reports = {};
	let remaining = group.validators.length;

	const flush = () => {
		const vals = Object.values(reports);
		setGroupStats(group.id, {
			errors: vals.reduce((a, r) => a + (r.errorCount ?? 0), 0),
			warnings: vals.reduce((a, r) => a + (r.warningCount ?? 0), 0),
			running: remaining > 0,
			done: remaining === 0,
			ok: remaining === 0 && vals.length > 0 && vals.every((r) => r.ok),
			skipped: remaining === 0 && vals.length > 0 && vals.every((r) => r.skipped)
		});
	};

	setGroupStats(group.id, {
		errors: 0,
		warnings: 0,
		running: true,
		done: false,
		ok: false,
		skipped: false
	});

	for (const v of group.validators) {
		const finish = () => {
			remaining = Math.max(0, remaining - 1);
			flush();
		};

		// Nicht-streamender Validator: Query über den /api-Proxy (POST) statt WS.
		if (v.query) {
			const q = v.query;
			fetch(q.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' } })
				.then((r) => (r.ok ? r.json() : null))
				.then((data) => {
					const raw = data && data[q.field];
					if (!raw) return;
					/** @type {any[]} */
					const findings = raw.findings?.length
						? raw.findings
						: (raw.messages ?? []).map(() => ({ level: 'INFO' }));
					const errorCount = findings.filter((f) => f.level === 'ERROR').length;
					reports[v.key] = {
						ok: errorCount === 0,
						errorCount,
						warningCount: findings.filter((f) => f.level === 'WARNING').length
					};
				})
				.catch(() => {})
				.finally(finish);
			continue;
		}

		const spec = v.argSpec ?? [];
		const decl = spec.length ? `(${spec.map((a) => `$${a.name}: ${a.type}`).join(', ')})` : '';
		const callArgs = spec.length ? `(${spec.map((a) => `${a.name}: $${a.name}`).join(', ')})` : '';
		/** @type {Record<string, any>} */
		const variables = {};
		for (const a of spec) variables[a.name] = a.value;
		const query = `subscription ${decl} { ${v.key}${callArgs} { level validation { ok errorCount warningCount skipped } } }`;
		client.subscribe(
			{ query, variables },
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
