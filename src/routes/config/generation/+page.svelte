<script>
	import WriteButton from '$lib/WriteButton.svelte';

	export let data;

	const NUM_FIELDS = [
		{ key: 'timelagMin', label: 'Zeitabstand (min)', int: true },
		{ key: 'iterations', label: 'Iterationen', int: true },
		{ key: 'startTemp', label: 'Start-Temperatur' },
		{ key: 'endTemp', label: 'End-Temperatur' },
		{ key: 'toleranceMin', label: 'Toleranz (min)', int: true },
		{ key: 'maxSpanHours', label: 'max. Spanne (h)' }
	];
	const WEIGHTS = [
		{ key: 'weightMinuteBalance', label: 'Minuten-Balance' },
		{ key: 'weightBeyondTolerance', label: 'über Toleranz' },
		{ key: 'weightOverTargetFactor', label: 'über Soll (Faktor)' },
		{ key: 'weightCoverage', label: 'Abdeckung' },
		{ key: 'weightMaxDays', label: 'max. Tage' },
		{ key: 'weightPreferExamDays', label: 'Prüfungstage bevorzugen' },
		{ key: 'weightDistribution', label: 'Verteilung' },
		{ key: 'weightDaySpan', label: 'Tages-Spanne' }
	];
	const ALL = [...NUM_FIELDS, ...WEIGHTS];

	/** @type {Record<string, any>} */
	let form = {};
	for (const f of ALL) form[f.key] = data.config?.[f.key] ?? 0;

	let saving = false;
	let error = '';
	let savedAt = '';

	async function save() {
		if (saving) return;
		saving = true;
		error = '';
		savedAt = '';
		/** @type {Record<string, number>} */
		const input = {};
		for (const f of ALL) input[f.key] = Number(form[f.key]) || 0;
		try {
			const res = await fetch('/api/setGenerationConfig', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				error = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			savedAt = new Date().toLocaleTimeString('de-DE');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Einteilungs-Parameter</h1>
		<span class="text-sm text-base-content/50">global · Aufsichten-Einteilung</span>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}
	{#if savedAt}
		<div class="alert alert-success py-2 text-sm"><span>Gespeichert ({savedAt}).</span></div>
	{/if}

	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="font-semibold">Verfahren (Simulated Annealing)</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{#each NUM_FIELDS as f}
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">{f.label}</span>
					<input
						type="number"
						step={f.int ? '1' : 'any'}
						class="input input-bordered input-sm"
						bind:value={form[f.key]}
					/>
				</label>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="font-semibold">Gewichte</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each WEIGHTS as f}
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">{f.label}</span>
					<input
						type="number"
						step="any"
						class="input input-bordered input-sm"
						bind:value={form[f.key]}
					/>
				</label>
			{/each}
		</div>
	</div>

	<div class="flex items-center gap-3">
		<WriteButton class="btn btn-primary" disabled={saving} on:click={save}>
			{saving ? 'speichert …' : 'Speichern'}
		</WriteButton>
	</div>
</div>
