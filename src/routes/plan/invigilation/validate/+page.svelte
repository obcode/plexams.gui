<script>
	import { onMount, onDestroy } from 'svelte';
	import { env } from '$env/dynamic/public';
	import ValidatorCard from '$lib/invigilator/ValidatorCard.svelte';

	// Die fünf Validatoren — je eine eigene Subscription.
	/**
	 * @type {{
	 *   key: string,
	 *   title: string,
	 *   description: string,
	 *   status: 'idle' | 'running' | 'done' | 'error',
	 *   lines: { level: string, html: string }[],
	 *   current: { html: string } | null,
	 *   report: any,
	 *   errorMsg: string | null
	 * }[]}
	 */
	let validators = [
		{
			key: 'validateInvigilatorRequirements',
			title: 'Anforderungen',
			description: 'Aufsichts-Anforderungen erfüllt'
		},
		{
			key: 'validateInvigilationDuplicates',
			title: 'Doppelbelegungen',
			description: 'keine doppelten Aufsichten'
		},
		{
			key: 'validateInvigilatorSlots',
			title: 'Slots',
			description: 'Aufsichten in gültigen Slots'
		},
		{
			key: 'validateInvigilationsTimeDistance',
			title: 'Zeitabstände',
			description: 'Abstände zwischen Aufsichten'
		},
		{
			key: 'validateInvigilationConstraints',
			title: 'Constraints',
			description: 'Constraints eingehalten'
		}
	].map((v) => ({
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

	function wsUrl() {
		const http = env.PUBLIC_PLEXAMS_SERVER || 'http://localhost:8080/query';
		return http.replace(/^http/, 'ws');
	}

	async function ensureClient() {
		if (!convert) {
			const Convert = (await import('ansi-to-html')).default;
			convert = new Convert({
				fg: '#d4d4d4',
				bg: '#1e1e2e',
				newline: false,
				escapeXML: true,
				colors: {
					0: '#1e1e2e',
					1: '#f38ba8',
					2: '#a6e3a1',
					3: '#f9e2af',
					4: '#89b4fa',
					5: '#cba6f7',
					6: '#94e2d5',
					7: '#bac2de'
				}
			});
		}
		if (!wsClient) {
			const { createClient } = await import('graphql-ws');
			wsClient = createClient({ url: wsUrl(), lazy: true, retryAttempts: 0 });
		}
	}

	/** @param {number} i */
	async function runValidator(i) {
		try {
			await ensureClient();
		} catch (e) {
			setupError = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			return;
		}

		const v = validators[i];
		if (subs[i]) {
			subs[i]?.();
			subs[i] = null;
		}
		v.status = 'running';
		v.lines = [];
		v.current = null;
		v.report = null;
		v.errorMsg = null;
		validators = validators;

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
						validators = validators;
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
					validators = validators;
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
					validators = validators;
				},
				complete: () => {
					v.current = null;
					if (v.status === 'running') v.status = 'done';
					validators = validators;
				}
			}
		);
	}

	function runAll() {
		for (let i = 0; i < validators.length; i++) runValidator(i);
	}

	onMount(() => {
		runAll();
	});

	onDestroy(() => {
		for (const u of subs) if (u) u();
		if (wsClient) wsClient.dispose();
	});

	// Gesamtüberblick
	$: anyRunning = validators.some((v) => v.status === 'running');
	$: totalErrors = validators.reduce((s, v) => s + (v.report?.errorCount ?? 0), 0);
	$: totalWarnings = validators.reduce((s, v) => s + (v.report?.warningCount ?? 0), 0);
	$: allDone = validators.every((v) => v.status === 'done' || v.status === 'error');
	$: allOk = allDone && validators.every((v) => v.report && v.report.ok);
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Aufsichten validieren</h1>
		{#if anyRunning}
			<span class="badge badge-info gap-2">
				<span class="loading loading-spinner loading-xs"></span> läuft …
			</span>
		{:else if allOk}
			<span class="badge badge-success">✓ alles OK</span>
		{:else if allDone}
			<span class="badge badge-error">Probleme gefunden</span>
		{/if}
	</div>

	<!-- Überblick -->
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
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

	<!-- Validator-Karten -->
	<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
		{#each validators as validator, i}
			<ValidatorCard {validator} on:restart={() => runValidator(i)} />
		{/each}
	</div>
</div>
