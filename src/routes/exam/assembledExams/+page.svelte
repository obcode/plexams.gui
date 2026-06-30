<script>
	export let data;
	import AssembledExamsTable from '$lib/exam/AssembledExamsTable.svelte';
	import { assembledExamsState } from '$lib/assembledExams/store';
	import { studentRegsState } from '$lib/studentRegs/store';
	import { preparing, regeneratePreparation } from '$lib/prepare';

	// Vorbedingungen: ZPA & Primuss importiert UND der manuelle Haken
	// „ZPA- & Primuss-Prüfungen verknüpft" gesetzt. Connected Exams werden live
	// berechnet — kein separater Schritt.
	$: canGenerate =
		!!data.conditions?.zpaImported &&
		!!data.conditions?.primussImported &&
		!!data.conditions?.zpaPrimussConnected;
	$: stale = $assembledExamsState.dirty || $studentRegsState.dirty;

	/** @type {{ changes: any[]; studentCount: number } | null} */
	let prepResult = null;
	let prepError = '';
	const KIND_BADGE = /** @type {Record<string, string>} */ ({
		added: 'badge-success',
		removed: 'badge-error',
		changed: 'badge-warning'
	});
	const KIND_LABEL = /** @type {Record<string, string>} */ ({
		added: 'neu',
		removed: 'entfernt',
		changed: 'geändert'
	});

	async function runPrepare() {
		if (!canGenerate || $preparing) return;
		prepError = '';
		const { changes, studentCount, error } = await regeneratePreparation();
		if (error) {
			prepError = error;
			return;
		}
		prepResult = { changes, studentCount };
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Aufbereitete Prüfungen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.plannedExams.length}</span>
		<span class="text-sm text-base-content/50">mit Anmeldungen</span>
	</div>

	<!-- Generieren (Prüfungen + StudentRegs in einem Schritt) -->
	<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-center gap-3">
			<button
				class="btn btn-primary btn-sm"
				disabled={!canGenerate || $preparing}
				on:click={runPrepare}
			>
				{$preparing ? 'generiert …' : stale ? 'neu generieren' : 'Generieren'}
			</button>
			{#if !canGenerate}
				<span class="text-sm text-warning">
					Erst ZPA- &amp; Primuss-Prüfungen verknüpfen und den Haken setzen.
				</span>
			{:else if stale}
				<span class="text-sm text-warning">⚠ veraltet — bitte neu generieren.</span>
			{:else}
				<span class="text-sm text-base-content/50">
					Erzeugt aufbereitete Prüfungen &amp; StudentRegs in einem Schritt.
				</span>
			{/if}
		</div>

		{#if prepError}
			<div class="alert alert-error py-2 text-sm"><span>{prepError}</span></div>
		{/if}

		{#if prepResult}
			<div class="rounded-lg border border-success/40 bg-success/5 p-2">
				<div class="flex items-center gap-2 text-sm font-medium">
					Generiert: {prepResult.changes.length} Änderung(en) · {prepResult.studentCount} StudentRegs
					<div class="flex-1"></div>
					<button class="btn btn-ghost btn-xs" on:click={() => (prepResult = null)}>schließen</button>
				</div>
				{#if prepResult.changes.length}
					<ul class="mt-1 flex max-h-72 flex-col gap-1 overflow-y-auto text-sm">
						{#each prepResult.changes as c}
							<li class="rounded border border-base-300/40 p-1.5">
								<div class="flex flex-wrap items-center gap-2">
									<span class="badge badge-sm {KIND_BADGE[c.kind] ?? 'badge-ghost'}">
										{KIND_LABEL[c.kind] ?? c.kind}
									</span>
									<span class="font-mono tabular-nums">{c.ancode}</span>
									<span>{c.module}</span>
								</div>
								{#if (c.details ?? []).length}
									<ul class="mt-1 ml-1 list-inside list-disc text-xs text-base-content/70">
										{#each c.details as d}
											<li>{d}</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<span class="text-sm opacity-70">an den aufbereiteten Prüfungen nichts geändert</span>
				{/if}
			</div>
		{/if}
	</div>

	<AssembledExamsTable exams={data.plannedExams} />
</div>
