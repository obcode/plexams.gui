<script>
	export let data;

	/** @type {any} */
	let state = data.planningState;
	$: state = data.planningState;

	/** @type {Set<string>} */
	let busy = new Set();
	/** @type {string | null} */
	let errorMsg = null;

	/** @type {Record<string, string>} */
	const AREA_LABEL = {
		ROOMS: 'Raumgenerierung gesperrt — Raumplan veröffentlicht',
		INVIGILATIONS: 'Aufsichtengenerierung gesperrt — Aufsichtenplan veröffentlicht'
	};

	/** @param {any} cond */
	async function toggle(cond) {
		if (busy.has(cond.key)) return;
		busy = new Set(busy).add(cond.key);
		errorMsg = null;
		try {
			const res = await fetch('/api/setPlanningCondition', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: cond.key, done: !cond.done })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			state = result.setPlanningCondition;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busy);
			s.delete(cond.key);
			busy = s;
		}
	}

	$: doneCount = state.phases
		.flatMap((/** @type {any} */ p) => p.conditions)
		.filter((/** @type {any} */ c) => c.done).length;
	$: totalCount = state.phases.flatMap((/** @type {any} */ p) => p.conditions).length;
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Prüfungsplanung {data.semester}</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{doneCount}/{totalCount}</span>
	</div>

	{#if state.blockedAreas.length}
		<div class="flex flex-col gap-1">
			{#each state.blockedAreas as area}
				<div class="alert alert-warning py-2 text-sm">
					<span>🔒 {AREA_LABEL[area] ?? `${area} gesperrt`}</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
		{#each state.phases as phase}
			{@const total = phase.conditions.length}
			{@const done = phase.conditions.filter((/** @type {any} */ c) => c.done).length}
			{@const complete = total > 0 && done === total}
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex items-start justify-between gap-2">
					<div class="font-semibold">{phase.title}</div>
					<!-- Fortschritts-Ring (Things3-Stil): füllt im Uhrzeigersinn; fertig = grün + Haken -->
					<div
						class="radial-progress shrink-0 text-xs font-semibold {complete
							? 'text-success'
							: 'text-primary'}"
						style="--value:{complete
							? 100
							: total
								? Math.round((done / total) * 100)
								: 0}; --size:2.4rem; --thickness:3px"
						role="progressbar"
						aria-valuenow={done}
						aria-valuemax={total}
						title="{done}/{total} erledigt"
					>
						{#if complete}
							<span class="text-base">✓</span>
						{:else}
							<span class="tabular-nums text-base-content/70">{done}/{total}</span>
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-1">
					{#each phase.conditions as cond}
						<label class="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-base-200">
							<input
								type="checkbox"
								class="checkbox checkbox-sm mt-0.5"
								checked={cond.done}
								disabled={busy.has(cond.key)}
								on:change={() => toggle(cond)}
							/>
							<span
								class="flex-1 text-sm {cond.done ? 'text-base-content' : 'text-base-content/70'}"
							>
								{cond.title}
							</span>
							{#if cond.gate}
								<span
									class="text-base-content/40"
									title="Sperre: ist dies erledigt, wird die {cond.gate}-Generierung gesperrt"
								>
									🔒
								</span>
							{/if}
						</label>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<p class="max-w-3xl text-xs text-base-content/50">
		Manche Häkchen setzen sich beim Ausführen der Operationen (Generieren/Veröffentlichen)
		automatisch. „Veröffentlicht" bedeutet: die Veröffentlichungs-E-Mail wurde verschickt (nicht der
		ZPA-Upload). Für kleine Korrekturen nach der Veröffentlichung das Häkchen kurz lösen, neu
		generieren und wieder setzen.
	</p>
</div>
