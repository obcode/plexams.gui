<script>
	import ValidationGroup from '$lib/validation/ValidationGroup.svelte';
	import { validationGroups as groups } from '$lib/validation/validators';

	/** @type {Record<string, { errors: number, warnings: number, running: boolean, done: boolean, ok: boolean }>} */
	let stats = {};

	/**
	 * @param {string} id
	 * @param {CustomEvent<any>} e
	 */
	function onStats(id, e) {
		stats = { ...stats, [id]: e.detail };
	}

	$: all = Object.values(stats);
	$: totalErrors = all.reduce((s, v) => s + (v.errors ?? 0), 0);
	$: totalWarnings = all.reduce((s, v) => s + (v.warnings ?? 0), 0);
	$: anyRunning = all.some((v) => v.running);
	$: allDone = all.length === groups.length && all.every((v) => v.done);
	$: allOk = allDone && all.every((v) => v.ok);
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Validierung</h1>
		{#if anyRunning}
			<span class="badge badge-info gap-2">
				<span class="loading loading-spinner loading-xs"></span> läuft …
			</span>
		{:else if allOk}
			<span class="badge badge-success">✓ alles OK</span>
		{:else if allDone}
			<span class="badge badge-error">Probleme gefunden</span>
		{/if}
		<div class="flex-1"></div>
		<div class="flex gap-2">
			<div
				class="rounded-lg border px-4 py-2 text-center {totalErrors > 0
					? 'border-error/40 bg-error/10'
					: 'border-base-300 bg-base-100'}"
			>
				<div class="text-2xl font-semibold tabular-nums {totalErrors > 0 ? 'text-error' : ''}">
					{totalErrors}
				</div>
				<div class="text-xs text-base-content/60">Fehler gesamt</div>
			</div>
			<div
				class="rounded-lg border px-4 py-2 text-center {totalWarnings > 0
					? 'border-warning/40 bg-warning/10'
					: 'border-base-300 bg-base-100'}"
			>
				<div class="text-2xl font-semibold tabular-nums {totalWarnings > 0 ? 'text-warning' : ''}">
					{totalWarnings}
				</div>
				<div class="text-xs text-base-content/60">Warnungen gesamt</div>
			</div>
		</div>
	</div>

	{#each groups as group}
		<ValidationGroup
			validators={group.validators}
			title={group.title}
			storeId={group.id}
			collapsible
			collapsed
			on:stats={(e) => onStats(group.id, e)}
		/>
	{/each}
</div>
