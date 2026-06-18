<script>
	import { onDestroy, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { getConvert, getWsClient } from '$lib/validation/wsClient';

	/** Subscription-Feldname */
	export let field;
	export let title;
	export let description = '';
	/** Feld hat ein dryRun-Argument */
	export let hasDryRun = false;
	/** Akzentfarbe: 'info' (Download) | 'success' (Upload) */
	export let accent = 'info';
	export let actionLabel = 'Starten';

	let dryRun = true;

	/** @type {'idle' | 'running' | 'done' | 'error'} */
	let status = 'idle';
	/** @type {{ html: string }[]} */
	let lines = [];
	/** @type {{ html: string } | null} */
	let current = null;
	/** @type {string | null} */
	let errorMsg = null;

	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;
	/** @type {HTMLDivElement} */
	let termEl;

	async function scrollToBottom() {
		await tick();
		if (termEl) termEl.scrollTop = termEl.scrollHeight;
	}

	/** @param {any} err */
	function errText(err) {
		return err instanceof Error
			? err.message
			: Array.isArray(err)
				? err.map((/** @type {any} */ e) => e.message).join('; ')
				: err && err.reason
					? err.reason
					: 'Verbindungsfehler';
	}

	async function start() {
		if (status === 'running') return;
		lines = [];
		current = null;
		errorMsg = null;
		status = 'running';

		try {
			if (!convert) convert = await getConvert();
			if (!wsClient) wsClient = await getWsClient();
		} catch (e) {
			errorMsg = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			status = 'error';
			return;
		}

		const query = hasDryRun
			? `subscription ($dryRun: Boolean!) { ${field}(dryRun: $dryRun) { level text } }`
			: `subscription { ${field} { level text } }`;
		const variables = hasDryRun ? { dryRun } : {};

		unsubscribe = wsClient.subscribe(
			{ query, variables },
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						status = 'error';
						return;
					}
					const line = msg.data && msg.data[field];
					if (!line) return;
					const html = convert.toHtml(line.text ?? '');
					if (line.level === 'PROGRESS') {
						current = { html };
					} else {
						if (current) {
							lines = [...lines, { html: current.html }];
							current = null;
						}
						lines = [...lines, { html }];
						if (line.level === 'DONE') status = 'done';
					}
					scrollToBottom();
				},
				/** @param {any} err */
				error: (err) => {
					errorMsg = errText(err);
					status = 'error';
				},
				complete: () => {
					if (current) {
						lines = [...lines, { html: current.html }];
						current = null;
					}
					if (status === 'running') status = 'done';
				}
			}
		);
	}

	function stop() {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
		status = 'idle';
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<div
	class="flex flex-col gap-2 rounded-lg border p-3 {status === 'error'
		? 'border-error/40'
		: status === 'done'
			? 'border-success/40'
			: 'border-base-200'}"
>
	<div class="flex items-center justify-between gap-3">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<span class="font-medium">{title}</span>
				{#if status === 'running'}
					<span class="badge badge-info badge-sm gap-1">
						<span class="loading loading-spinner loading-xs"></span> läuft
					</span>
				{:else if status === 'done'}
					<span class="badge badge-success badge-sm">✓ fertig</span>
				{:else if status === 'error'}
					<span class="badge badge-error badge-sm">Fehler</span>
				{/if}
			</div>
			{#if description}
				<div class="text-xs text-base-content/60">{description}</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if hasDryRun}
				<label
					class="label cursor-pointer gap-1.5 px-0"
					title="Probelauf — nur erzeugen, nicht senden"
				>
					<span class="label-text text-xs">Probelauf</span>
					<input
						type="checkbox"
						class="toggle toggle-xs"
						bind:checked={dryRun}
						disabled={status === 'running'}
					/>
				</label>
			{/if}
			{#if status === 'running'}
				<button class="btn btn-error btn-sm" on:click={stop}>Abbrechen</button>
			{:else}
				<button class="btn btn-{accent} btn-sm" on:click={start}>{actionLabel}</button>
			{/if}
		</div>
	</div>

	{#if hasDryRun && dryRun && status !== 'running'}
		<div class="text-[10px] text-base-content/50">
			Probelauf aktiv — es wird nichts ins ZPA gesendet.
		</div>
	{/if}

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm">
			<span>{errorMsg}</span>
		</div>
	{/if}

	{#if lines.length || current}
		<div
			bind:this={termEl}
			class="max-h-48 overflow-auto rounded-lg p-2 font-mono text-xs leading-relaxed"
			style="background:#1e1e2e; color:#d4d4d4"
			transition:slide
		>
			{#each lines as line}
				<div class="whitespace-pre-wrap break-words">{@html line.html}</div>
			{/each}
			{#if current}
				<div class="flex items-start gap-2 whitespace-pre-wrap break-words" style="color:#f9e2af">
					<span class="loading loading-spinner loading-xs mt-0.5"></span>
					<span>{@html current.html}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
