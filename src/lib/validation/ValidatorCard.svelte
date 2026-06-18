<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';

	/**
	 * @type {{
	 *   key: string,
	 *   title: string,
	 *   description?: string,
	 *   status: 'idle' | 'running' | 'done' | 'error',
	 *   lines: { level: string, html: string }[],
	 *   current: { html: string } | null,
	 *   report: any,
	 *   errorMsg: string | null
	 * }}
	 */
	export let validator;

	const dispatch = createEventDispatcher();

	let showTerminal = false;

	/** @param {string} level */
	function levelIcon(level) {
		if (level === 'ERROR') return '⛔';
		if (level === 'WARNING') return '⚠️';
		return 'ℹ️';
	}
	/** @param {string} level */
	function levelClass(level) {
		if (level === 'ERROR') return 'border-error/40 bg-error/5';
		if (level === 'WARNING') return 'border-warning/40 bg-warning/5';
		return 'border-info/40 bg-info/5';
	}
</script>

<div
	class="flex flex-col gap-3 rounded-lg border bg-base-100 p-4 {validator.report
		? validator.report.ok
			? 'border-success/40'
			: 'border-error/40'
		: validator.status === 'error'
			? 'border-error/40'
			: 'border-base-300'}"
>
	<!-- Kopf -->
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<div class="font-medium">{validator.title}</div>
			{#if validator.description}
				<div class="text-xs text-base-content/50">{validator.description}</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if validator.status === 'running'}
				<span class="badge badge-info gap-2">
					<span class="loading loading-spinner loading-xs"></span> läuft
				</span>
			{:else if validator.status === 'error'}
				<span class="badge badge-error">Fehler</span>
			{:else if validator.report}
				{#if validator.report.ok}
					<span class="badge badge-success">✓ OK</span>
				{/if}
				{#if validator.report.errorCount > 0}
					<span class="badge badge-error tabular-nums">{validator.report.errorCount} Fehler</span>
				{/if}
				{#if validator.report.warningCount > 0}
					<span class="badge badge-warning tabular-nums">{validator.report.warningCount} Warn.</span
					>
				{/if}
			{:else}
				<span class="badge badge-ghost">—</span>
			{/if}
			<button
				class="btn btn-ghost btn-xs"
				title="Neu starten"
				aria-label="Neu starten"
				disabled={validator.status === 'running'}
				on:click={() => dispatch('restart')}
			>
				↻
			</button>
		</div>
	</div>

	<!-- laufende Zeile -->
	{#if validator.status === 'running' && validator.current}
		<div
			class="flex items-center gap-2 truncate rounded px-2 py-1 font-mono text-xs"
			style="background:#1e1e2e; color:#f9e2af"
		>
			<span class="loading loading-spinner loading-xs"></span>
			<span class="truncate">{@html validator.current.html}</span>
		</div>
	{/if}

	{#if validator.status === 'error' && validator.errorMsg}
		<div class="alert alert-error py-2 text-sm">
			<span>{validator.errorMsg}</span>
		</div>
	{/if}

	<!-- Findings -->
	{#if validator.report && validator.report.findings && validator.report.findings.length}
		<div class="flex flex-col gap-1.5">
			{#each validator.report.findings as f}
				<div class="rounded border px-3 py-1.5 text-sm {levelClass(f.level)}">
					<div class="flex items-start gap-2">
						<span class="mt-0.5">{levelIcon(f.level)}</span>
						<div class="min-w-0 flex-1">
							<div class="break-words">{f.message}</div>
							{#if f.ancode || (f.relatedAncodes && f.relatedAncodes.length) || f.room || f.day != null || f.slot != null || f.invigilatorID != null || f.studentMtknr}
								<div class="mt-1 flex flex-wrap gap-1">
									{#if f.ancode}
										<span class="badge badge-outline badge-xs">Prüfung {f.ancode}</span>
									{/if}
									{#each f.relatedAncodes ?? [] as ra}
										<span class="badge badge-outline badge-xs">↔ {ra}</span>
									{/each}
									{#if f.room}
										<span class="badge badge-outline badge-xs">Raum {f.room}</span>
									{/if}
									{#if f.day != null && f.slot != null}
										<span class="badge badge-outline badge-xs">Tag {f.day} · Slot {f.slot}</span>
									{:else if f.day != null}
										<span class="badge badge-outline badge-xs">Tag {f.day}</span>
									{:else if f.slot != null}
										<span class="badge badge-outline badge-xs">Slot {f.slot}</span>
									{/if}
									{#if f.invigilatorID != null}
										<span class="badge badge-outline badge-xs">Aufsicht {f.invigilatorID}</span>
									{/if}
									{#if f.studentMtknr}
										<span class="badge badge-outline badge-xs">MtkNr {f.studentMtknr}</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if validator.report && validator.report.ok}
		<div class="text-sm text-success">Keine Beanstandungen.</div>
	{/if}

	<!-- Terminal (einklappbar) -->
	{#if validator.lines.length}
		<div>
			<button
				class="btn btn-ghost btn-xs gap-1 px-1 text-base-content/60"
				on:click={() => (showTerminal = !showTerminal)}
			>
				{showTerminal ? '▾' : '▸'} Terminal-Ausgabe ({validator.lines.length})
			</button>
			{#if showTerminal}
				<div
					class="mt-1 max-h-60 overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
					style="background:#1e1e2e; color:#d4d4d4"
					transition:slide
				>
					{#each validator.lines as line}
						<div class="whitespace-pre-wrap break-words">{@html line.html}</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
