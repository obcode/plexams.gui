<script>
	// Editiert eine Teilmenge der globalen generationConfig und schreibt die
	// *vollständige* Config zurück (Input ist komplett non-null → Round-Trip über
	// toGenerationConfigInput, damit die Felder der anderen Solver erhalten
	// bleiben). Wird von den Solver-Seiten mit ihrer jeweiligen Feldgruppe
	// eingebunden (Terminplan, Phase A, Pre-Plan, Aufsichten).
	import WriteButton from '$lib/WriteButton.svelte';
	import { toGenerationConfigInput } from '$lib/semester/generationConfig';

	/** @typedef {import('$lib/semester/generationConfig').GenerationConfigField} GenerationConfigField */
	/** @typedef {{ label?: string, cols?: string, fields: GenerationConfigField[] }} ConfigSection */

	/** @type {{ config?: any, sections: ConfigSection[], saveLabel?: string, onsaved?: (() => void) | undefined }} */
	let {
		config = null,
		sections,
		saveLabel = 'Parameter speichern',
		onsaved = undefined
	} = $props();

	const allFields = sections.flatMap((s) => s.fields);
	// Einmal aus der geladenen Config vorbelegen (die Config ändert sich während
	// der Seitenlebensdauer nicht — sie kommt aus dem SSR-Load).
	/** @type {Record<string, any>} */
	let form = $state(Object.fromEntries(allFields.map((f) => [f.key, config?.[f.key] ?? 0])));

	let saving = $state(false);
	let error = $state('');
	let savedAt = $state('');

	async function save() {
		if (saving || !config) return;
		saving = true;
		error = '';
		savedAt = '';
		// Nur die hier editierten Felder überschreiben, den Rest verbatim durchreichen.
		/** @type {Record<string, any>} */
		const overrides = {};
		for (const f of allFields) overrides[f.key] = form[f.key];
		const input = toGenerationConfigInput(config, overrides);
		try {
			const res = await fetch('/api/semester/setGenerationConfig', {
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
			onsaved?.();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}
	{#if savedAt}
		<div class="alert alert-success py-2 text-sm">
			<span>Parameter gespeichert ({savedAt}).</span>
		</div>
	{/if}
	{#if !config}
		<div class="alert alert-warning py-2 text-sm">
			<span>Generation-Config nicht geladen — Speichern deaktiviert.</span>
		</div>
	{/if}

	{#each sections as section}
		<div class="flex flex-col gap-2">
			{#if section.label}
				<div class="text-xs font-medium text-base-content/50">{section.label}</div>
			{/if}
			<div class="grid grid-cols-1 gap-3 {section.cols ?? 'sm:grid-cols-3 xl:grid-cols-4'}">
				{#each section.fields as f}
					<label class="flex flex-col gap-1">
						<span
							class="flex items-center gap-1 text-xs font-medium text-base-content/60"
							title={f.hint ?? ''}
						>
							{f.label}
							{#if f.caution}
								<span class="badge badge-warning badge-xs" title="dominant — mit Vorsicht ändern"
									>⚠ Vorsicht</span
								>
							{/if}
						</span>
						<input
							type="number"
							step={f.int ? '1' : 'any'}
							class="input input-bordered input-sm {f.caution ? 'input-warning' : ''}"
							bind:value={form[f.key]}
							disabled={!config}
						/>
						{#if f.hint}
							<span class="text-[10px] leading-tight text-base-content/40">{f.hint}</span>
						{/if}
					</label>
				{/each}
			</div>
		</div>
	{/each}

	<div>
		<WriteButton class="btn btn-outline btn-sm" disabled={saving || !config} onclick={save}>
			{saving ? 'speichert …' : saveLabel}
		</WriteButton>
	</div>
</div>
