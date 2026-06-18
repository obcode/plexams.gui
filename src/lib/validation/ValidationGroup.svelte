<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { getConvert, getWsClient } from '$lib/validation/wsClient';
	import ValidatorCard from '$lib/validation/ValidatorCard.svelte';

	/** @type {{ key: string, title: string, description: string }[]} */
	export let validators;
	/** optionale Überschrift über der Gruppe */
	export let title = '';
	/** automatisch beim Einhängen starten */
	export let autostart = true;

	const dispatch = createEventDispatcher();

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
	let state = validators.map((v) => ({
		...v,
		status: /** @type {'idle'} */ ('idle'),
		lines: /** @type {{ level: string, html: string }[]} */ ([]),
		current: /** @type {{ html: string } | null} */ (null),
		report: /** @type {any} */ (null),
		errorMsg: /** @type {string | null} */ (null)
	}));

	/** @type {(null | (() => void))[]} */
	let subs = validators.map(() => null);

	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {string | null} */
	let setupError = null;

	async function ensureClient() {
		if (!convert) convert = await getConvert();
		if (!wsClient) wsClient = await getWsClient();
	}

	/** @param {number} i */
	async function runValidator(i) {
		try {
			await ensureClient();
		} catch (e) {
			setupError = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			return;
		}

		const v = state[i];
		if (subs[i]) {
			subs[i]?.();
			subs[i] = null;
		}
		v.status = 'running';
		v.lines = [];
		v.current = null;
		v.report = null;
		v.errorMsg = null;
		state = state;

		const query = `subscription { ${v.key} {
			level
			text
			validation {
				name ok errorCount warningCount
				findings { level message ancode relatedAncodes room day slot invigilatorID studentMtknr }
			}
		} }`;

		subs[i] = wsClient.subscribe(
			{ query },
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						v.errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						v.status = 'error';
						state = state;
						return;
					}
					const line = msg.data && msg.data[v.key];
					if (!line) return;
					const html = convert.toHtml(line.text ?? '');
					if (line.level === 'PROGRESS') {
						v.current = { html };
					} else {
						if (v.current) {
							v.lines.push({ level: 'PROGRESS', html: v.current.html });
							v.current = null;
						}
						v.lines.push({ level: line.level, html });
						if (line.validation) v.report = line.validation;
						if (line.level === 'DONE') v.status = 'done';
					}
					state = state;
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
					state = state;
				},
				complete: () => {
					v.current = null;
					if (v.status === 'running') v.status = 'done';
					state = state;
				}
			}
		);
	}

	export function runAll() {
		for (let i = 0; i < state.length; i++) runValidator(i);
	}

	onMount(() => {
		if (autostart) runAll();
	});

	onDestroy(() => {
		for (const u of subs) if (u) u();
	});

	$: anyRunning = state.some((v) => v.status === 'running');
	$: totalErrors = state.reduce((s, v) => s + (v.report?.errorCount ?? 0), 0);
	$: totalWarnings = state.reduce((s, v) => s + (v.report?.warningCount ?? 0), 0);
	$: allDone = state.every((v) => v.status === 'done' || v.status === 'error');
	$: allOk = allDone && state.every((v) => v.report && v.report.ok);

	// Kennzahlen nach oben melden (für die Gesamtseite).
	$: dispatch('stats', {
		errors: totalErrors,
		warnings: totalWarnings,
		running: anyRunning,
		done: allDone,
		ok: allOk
	});
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		{#if title}
			<div class="flex items-center gap-2">
				<span class="text-lg font-semibold">{title}</span>
				{#if anyRunning}
					<span class="badge badge-info gap-2">
						<span class="loading loading-spinner loading-xs"></span> läuft
					</span>
				{:else if allOk}
					<span class="badge badge-success">✓ OK</span>
				{:else if allDone}
					<span class="badge badge-error">Probleme</span>
				{/if}
			</div>
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
		</div>
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm gap-2" on:click={runAll} disabled={anyRunning}>
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

	<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
		{#each state as validator, i}
			<ValidatorCard {validator} on:restart={() => runValidator(i)} />
		{/each}
	</div>
</div>
