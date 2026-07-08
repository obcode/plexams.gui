<script>
	import { onMount, onDestroy, untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { getConvert, getWsClient } from '$lib/validation/wsClient';
	import { setGroupStats } from '$lib/validation/store';
	import ValidatorCard from '$lib/validation/ValidatorCard.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/validation/validators').ValidatorDef[]} validators
	 * @property {string} [title] - optionale Überschrift über der Gruppe
	 * @property {boolean} [autostart] - automatisch beim Einhängen starten
	 * @property {string} [storeId] - wenn gesetzt, wird das Ergebnis unter dieser ID in den globalen Store gespiegelt
	 * @property {Record<string, Record<string, any>>} [argOverrides] - pro Validator-Key überschreibbare Argument-Werte, z. B. { validateConflicts: { ancode: 42 } }
	 * @property {boolean} [collapsible] - Karten ein-/ausklappbar machen (Header bleibt sichtbar)
	 * @property {boolean} [collapsed] - initial eingeklappt (nur relevant bei collapsible)
	 * @property {((mtknr: string, ancode: number, reason: string) => Promise<{ ok: boolean, error?: string }>) | null} [onAcceptWaiver] - an die ValidatorCard durchgereicht: „eigener Raum"-Verzicht akzeptieren
	 * @property {(stats: { errors: number, warnings: number, running: boolean, done: boolean, ok: boolean, skipped: boolean }) => void} [onstats] - Kennzahlen nach oben melden (für die Gesamtseite)
	 */

	/** @type {Props} */
	let {
		validators,
		title = '',
		autostart = true,
		storeId = '',
		argOverrides = {},
		collapsible = false,
		collapsed = false,
		onAcceptWaiver = null,
		onstats
	} = $props();

	let open = $state(!collapsed);

	/**
	 * @type {{
	 *   key: string, title: string, description: string,
	 *   status: 'idle' | 'running' | 'done' | 'error',
	 *   lines: { level: string, html: string }[],
	 *   current: { html: string } | null,
	 *   report: any,
	 *   errorMsg: string | null
	 * }[]}
	 */
	let runs = $state(
		validators.map((v) => ({
			...v,
			status: /** @type {'idle'} */ ('idle'),
			lines: /** @type {{ level: string, html: string }[]} */ ([]),
			current: /** @type {{ html: string } | null} */ (null),
			report: /** @type {any} */ (null),
			errorMsg: /** @type {string | null} */ (null)
		}))
	);

	/** @type {(null | (() => void))[]} */
	let subs = validators.map(() => null);

	// erst nach dem ersten Lauf in den Store spiegeln, damit ein nicht
	// autostartendes Mounten den letzten gespeicherten Stand nicht überschreibt.
	let started = $state(false);

	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {string | null} */
	let setupError = $state(null);

	async function ensureClient() {
		if (!convert) convert = await getConvert();
		if (!wsClient) wsClient = await getWsClient();
	}

	// Graduierte Query-Antwort (PreplanValidation o. ä. mit { ok, findings,
	// messages }) → ValidationReport-Form, wie sie die Karte/Ampel erwartet.
	// ok = keine Errors (Warnings/Infos lassen es NICHT fehlschlagen). findings
	// fällt auf flache messages (als INFO) zurück, falls das Backend keine
	// graduierten liefert.
	/** @param {any} raw */
	function toValidationReport(raw) {
		const src = raw?.findings?.length
			? raw.findings
			: (raw?.messages ?? []).map((/** @type {string} */ m) => ({ level: 'INFO', message: m }));
		const findings = src.map((/** @type {any} */ f) => ({ level: f.level, message: f.message }));
		const errorCount = findings.filter((/** @type {any} */ f) => f.level === 'ERROR').length;
		const warningCount = findings.filter((/** @type {any} */ f) => f.level === 'WARNING').length;
		const infoCount = findings.filter((/** @type {any} */ f) => f.level === 'INFO').length;
		return {
			name: '',
			ok: errorCount === 0,
			errorCount,
			warningCount,
			infoCount,
			findings,
			skipped: !!raw?.skipped,
			skipReason: raw?.skipReason
		};
	}

	// Nicht-streamender Validator: Query über den /api-Proxy abfragen (POST) und
	// das Ergebnis in einen ValidationReport übersetzen — kein WS/LogLine.
	/**
	 * @param {number} i
	 * @param {import('$lib/validation/validators').QuerySpec} query
	 */
	async function runQueryValidator(i, query) {
		started = true;
		const v = runs[i];
		if (subs[i]) {
			subs[i]?.();
			subs[i] = null;
		}
		v.status = 'running';
		v.lines = [];
		v.current = null;
		v.report = null;
		v.errorMsg = null;
		try {
			const res = await fetch(query.endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' }
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data?.error) {
				v.errorMsg = data?.error || `Fehler (HTTP ${res.status})`;
				v.status = 'error';
				return;
			}
			v.report = toValidationReport(data[query.field]);
			v.status = 'done';
		} catch (e) {
			v.errorMsg = e instanceof Error ? e.message : String(e);
			v.status = 'error';
		}
	}

	// baut Subscription-Query + Variablen aus dem (optionalen) argSpec eines
	// Validators; per-Aufruf-Overrides haben Vorrang vor argOverrides, dann
	// vor den argSpec-Defaultwerten.
	/**
	 * @param {any} def
	 * @param {Record<string, any>} [callVars]
	 */
	function buildQuery(def, callVars) {
		const spec = def.argSpec ?? [];
		const fields = `level
			text
			validation {
				name ok errorCount warningCount infoCount skipped skipReason
				findings { level message ancode relatedAncodes room starttime invigilatorID studentMtknr }
			}`;
		if (!spec.length) {
			return { query: `subscription { ${def.key} { ${fields} } }`, variables: {} };
		}
		const decl = spec.map((/** @type {any} */ a) => `$${a.name}: ${a.type}`).join(', ');
		const callArgs = spec.map((/** @type {any} */ a) => `${a.name}: $${a.name}`).join(', ');
		/** @type {Record<string, any>} */
		const variables = {};
		for (const a of spec) {
			const override = callVars?.[a.name] ?? argOverrides[def.key]?.[a.name];
			variables[a.name] = override ?? a.value;
		}
		return {
			query: `subscription (${decl}) { ${def.key}(${callArgs}) { ${fields} } }`,
			variables
		};
	}

	/**
	 * @param {number} i
	 * @param {Record<string, any>} [callVars]
	 */
	async function runValidator(i, callVars) {
		const def = validators[i];
		if (def.query) {
			await runQueryValidator(i, def.query);
			return;
		}

		try {
			await ensureClient();
		} catch (e) {
			setupError = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			return;
		}

		started = true;
		const v = runs[i];
		if (subs[i]) {
			subs[i]?.();
			subs[i] = null;
		}
		v.status = 'running';
		v.lines = [];
		v.current = null;
		v.report = null;
		v.errorMsg = null;

		const { query, variables } = buildQuery(v, callVars);

		subs[i] = wsClient.subscribe(
			{ query, variables },
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						v.errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						v.status = 'error';
						return;
					}
					const line = msg.data && msg.data[v.key];
					if (!line) return;
					const html = convert.toHtml(line.text ?? '');
					if (line.level === 'PROGRESS') {
						v.current = { html };
						v.lines.push({ level: 'PROGRESS', html: v.current.html });
					} else {
						if (v.current) {
							v.current = null;
						}
						v.lines.push({ level: line.level, html });
						if (line.validation) v.report = line.validation;
						if (line.level === 'DONE') v.status = 'done';
					}
				},
				/** @param {any} err */
				error: (err) => {
					v.errorMsg =
						err instanceof Error
							? err.message
							: Array.isArray(err)
								? err.map((/** @type {any} */ e) => e.message).join('; ')
								: err && err.reason
									? err.reason
									: 'Verbindungsfehler';
					v.status = 'error';
				},
				complete: () => {
					v.current = null;
					if (v.status === 'running') v.status = 'done';
				}
			}
		);
	}

	export function runAll() {
		for (let i = 0; i < runs.length; i++) runValidator(i);
	}

	/**
	 * Einzelnen Validator (per Key) neu starten, optional mit expliziten
	 * Argument-Werten (umgeht Race mit dem argOverrides-Prop).
	 * @param {string} key
	 * @param {Record<string, any>} [callVars]
	 */
	export function runByKey(key, callVars) {
		const i = runs.findIndex((v) => v.key === key);
		if (i >= 0) runValidator(i, callVars);
	}

	onMount(() => {
		if (autostart) runAll();
	});

	onDestroy(() => {
		for (const u of subs) if (u) u();
	});

	let anyRunning = $derived(runs.some((v) => v.status === 'running'));
	let totalErrors = $derived(runs.reduce((s, v) => s + (v.report?.errorCount ?? 0), 0));
	let totalWarnings = $derived(runs.reduce((s, v) => s + (v.report?.warningCount ?? 0), 0));
	let totalInfos = $derived(runs.reduce((s, v) => s + (v.report?.infoCount ?? 0), 0));
	let allDone = $derived(runs.every((v) => v.status === 'done' || v.status === 'error'));
	let allOk = $derived(allDone && runs.every((v) => v.report && v.report.ok));
	// Alle Validatoren übersprungen → Gruppe neutral statt grünem „✓ OK" (nur für
	// die Badge-Anzeige; `stats.ok` bleibt bei allOk, damit die Ampel unverändert
	// „kein Problem" meldet — übersprungen ist laut Backend ok=true).
	let allSkipped = $derived(allDone && runs.length > 0 && runs.every((v) => v.report?.skipped));

	// Kennzahlen nach oben melden (für die Gesamtseite) und in den globalen Store.
	let stats = $derived({
		errors: totalErrors,
		warnings: totalWarnings,
		running: anyRunning,
		done: allDone,
		ok: allOk,
		skipped: allSkipped
	});
	// Nur auf Wertänderungen von `stats` reagieren. Die Callbacks werden per
	// untrack aufgerufen, damit weder eine bei jedem Parent-Render neu erzeugte
	// `onstats`-Closure noch der Store-Schreibzugriff den Effect erneut auslöst —
	// sonst entsteht mit der Gesamtseite /validate eine Endlosschleife
	// (effect_update_depth_exceeded → Seite friert ein).
	$effect(() => {
		const s = stats;
		untrack(() => onstats?.(s));
	});
	$effect(() => {
		const s = stats;
		if (storeId && started) untrack(() => setGroupStats(storeId, s));
	});
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		{#if title}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<svelte:element
				this={collapsible ? 'button' : 'div'}
				class="flex items-center gap-2 {collapsible ? 'cursor-pointer' : ''}"
				aria-expanded={collapsible ? open : undefined}
				onclick={() => collapsible && (open = !open)}
			>
				{#if collapsible}
					<span class="text-base-content/50">{open ? '▾' : '▸'}</span>
				{/if}
				<span class="text-lg font-semibold">{title}</span>
				{#if anyRunning}
					<span class="badge badge-info gap-2">
						<span class="loading loading-spinner loading-xs"></span> läuft
					</span>
				{:else if allSkipped}
					<span class="badge badge-ghost text-base-content/60">übersprungen</span>
				{:else if allOk}
					<span class="badge badge-success">✓ OK</span>
				{:else if allDone}
					<span class="badge badge-error">Probleme</span>
				{/if}
			</svelte:element>
			<div class="hidden h-8 w-px bg-base-300 sm:block"></div>
		{/if}
		<div class="flex gap-2">
			<div
				class="rounded-lg border px-4 py-2 text-center {totalErrors > 0
					? 'border-error/40 bg-error/10'
					: 'border-base-300'}"
			>
				<div class="text-2xl font-semibold tabular-nums {totalErrors > 0 ? 'text-error' : ''}">
					{totalErrors}
				</div>
				<div class="text-xs text-base-content/60">Fehler</div>
			</div>
			<div
				class="rounded-lg border px-4 py-2 text-center {totalWarnings > 0
					? 'border-warning/40 bg-warning/10'
					: 'border-base-300'}"
			>
				<div class="text-2xl font-semibold tabular-nums {totalWarnings > 0 ? 'text-warning' : ''}">
					{totalWarnings}
				</div>
				<div class="text-xs text-base-content/60">Warnungen</div>
			</div>
			<div class="rounded-lg border border-base-300 px-4 py-2 text-center">
				<div class="text-2xl font-semibold tabular-nums text-base-content/60">{totalInfos}</div>
				<div class="text-xs text-base-content/60">Infos</div>
			</div>
		</div>
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm gap-2" onclick={runAll} disabled={anyRunning}>
			{#if anyRunning}
				<span class="loading loading-spinner loading-xs"></span>
			{/if}
			↻ Alle neu prüfen
		</button>
	</div>

	{#if setupError}
		<div class="alert alert-error">
			<span>{setupError}</span>
		</div>
	{/if}

	{#if !collapsible || open}
		<div class="grid grid-cols-1 gap-3 xl:grid-cols-2" transition:slide>
			{#each runs as validator, i}
				<ValidatorCard {validator} {onAcceptWaiver} onrestart={() => runValidator(i)} />
			{/each}
		</div>
	{/if}
</div>
