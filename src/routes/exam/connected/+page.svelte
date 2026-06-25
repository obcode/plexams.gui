<script>
	export let data;

	// Stufen-Styles (Theme-Tokens). Reihenfolge der Schwere: error > warning > info > ok
	const LEVEL = /** @type {Record<string, any>} */ ({
		error: {
			rank: 3,
			border: 'border-error',
			tint: 'bg-error/5',
			dot: 'bg-error'
		},
		warning: {
			rank: 2,
			border: 'border-warning',
			tint: 'bg-warning/5',
			dot: 'bg-warning'
		},
		info: { rank: 1, border: 'border-base-300', tint: '', dot: 'bg-base-content/25' },
		ok: { rank: 0, border: 'border-success/40', tint: '', dot: 'bg-success' }
	});

	/** @param {any} exam → höchste Warnstufe der Zuordnung */
	function levelOf(exam) {
		let max = 'ok';
		for (const w of exam.warnings ?? []) {
			if (LEVEL[w.level]?.rank > LEVEL[max].rank) max = w.level;
		}
		// keine zugeordnete Primuss-Prüfung ist immer ein echtes Problem
		if ((exam.primussExams ?? []).length === 0 && LEVEL[max].rank < LEVEL.warning.rank)
			max = 'warning';
		return max;
	}

	/** @param {any} exam @param {string} lvl */
	const warningsOf = (exam, lvl) =>
		(exam.warnings ?? []).filter((/** @type {any} */ w) => w.level === lvl);

	$: rows = (data.connectedExams ?? []).map((/** @type {any} */ e) => ({
		...e,
		level: levelOf(e)
	}));

	$: counts = {
		total: rows.length,
		error: rows.filter((/** @type {any} */ r) => r.level === 'error').length,
		warning: rows.filter((/** @type {any} */ r) => r.level === 'warning').length,
		info: rows.filter((/** @type {any} */ r) => r.level === 'info').length,
		ok: rows.filter((/** @type {any} */ r) => r.level === 'ok').length
	};

	let onlyAttention = false;
	let q = '';

	$: filtered = rows.filter((/** @type {any} */ r) => {
		if (onlyAttention && (r.level === 'ok' || r.level === 'info')) return false;
		if (q.trim()) {
			const n = q.trim().toLowerCase();
			const hay =
				`${r.zpaExam.ancode} ${r.zpaExam.module} ${r.zpaExam.mainExamer} ` +
				(r.primussExams ?? [])
					.map((/** @type {any} */ p) => `${p.program} ${p.mainExamer}`)
					.join(' ');
			if (!hay.toLowerCase().includes(n)) return false;
		}
		return true;
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Zuordnung ZPA ↔ Primuss</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{counts.total}</span>
		<span class="text-sm text-base-content/50">ZPA-Prüfungen</span>
	</div>

	{#if data.loadError}
		<div class="alert alert-error">
			<span>
				Die Zuordnung konnte nicht geladen werden (Backend-Fehler):
				<span class="font-mono text-xs">{data.loadError}</span>
			</span>
		</div>
	{:else}
		<!-- Übersicht + Filter -->
		<div
			class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<div class="flex flex-wrap items-center gap-1.5">
				<span class="badge badge-success gap-1 tabular-nums">✓ {counts.ok} passt</span>
				<span class="badge badge-ghost gap-1 tabular-nums">ℹ {counts.info} Hinweise</span>
				<span class="badge badge-warning gap-1 tabular-nums">⚠ {counts.warning} Warnungen</span>
				<span class="badge badge-error gap-1 tabular-nums">✕ {counts.error} Fehler</span>
			</div>
			<div class="flex-1"></div>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={q}
				placeholder="Ancode, Modul, Prüfer:in …"
			/>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyAttention} />
				<span>nur Auffälligkeiten</span>
			</label>
		</div>

		<div class="flex flex-col gap-1.5">
			{#each filtered as exam (exam.zpaExam.ancode)}
				{@const lvl = LEVEL[exam.level]}
				{@const errs = warningsOf(exam, 'error')}
				{@const warns = warningsOf(exam, 'warning')}
				{@const infos = warningsOf(exam, 'info')}
				<div
					class="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-l-4 border-base-200 {lvl.border} {lvl.tint} p-3 md:grid-cols-2"
				>
					<!-- ZPA (Grundlage) -->
					<div class="flex gap-2">
						<span
							class="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full {lvl.dot}"
							title={exam.level}
						></span>
						<div class="min-w-0">
							<div class="flex flex-wrap items-baseline gap-x-2">
								<span
									class="font-mono text-lg font-semibold tabular-nums"
									class:text-warning={exam.zpaExam.ancode >= 1000}
									title={exam.zpaExam.ancode >= 1000 ? 'Ancode ≥ 1000' : ''}
								>
									{exam.zpaExam.ancode}
								</span>
								<span class="font-medium">{exam.zpaExam.module}</span>
							</div>
							<div class="text-sm text-base-content/70">{exam.zpaExam.mainExamer}</div>
							{#if (exam.zpaExam.groups ?? []).length}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each exam.zpaExam.groups as group}
										<span class="badge badge-ghost badge-xs">{group}</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Primuss (Anmeldedaten, vom Server zugeordnet) -->
					<div class="flex flex-col gap-1">
						{#each exam.primussExams ?? [] as p}
							<div class="flex flex-wrap items-baseline gap-x-2 text-sm">
								<span class="badge badge-neutral badge-sm">{p.program}</span>
								<span class="font-mono tabular-nums text-base-content/50">{p.ancode}</span>
								<span>{p.module}</span>
								<span class="text-base-content/50">· {p.mainExamer}</span>
							</div>
						{:else}
							<div class="text-sm font-medium text-error">— keine Primuss-Prüfung zugeordnet</div>
						{/each}

						{#if (exam.otherPrimussExams ?? []).length}
							<div class="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-base-content/50">
								<span>gleiche Nummer auch in:</span>
								{#each exam.otherPrimussExams as o}
									<span class="badge badge-outline badge-xs">{o.program}/{o.ancode}</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- echte Probleme prominent, über die volle Breite -->
					{#if errs.length || warns.length}
						<div class="flex flex-col gap-1 md:col-span-2">
							{#each errs as w}
								<div class="alert alert-error py-1.5 text-sm"><span>{w.message}</span></div>
							{/each}
							{#each warns as w}
								<div class="alert alert-warning py-1.5 text-sm"><span>{w.message}</span></div>
							{/each}
						</div>
					{/if}

					<!-- Hinweise (Schreibweise etc.) dezent & ausklappbar -->
					{#if infos.length}
						<details class="md:col-span-2">
							<summary
								class="cursor-pointer list-none text-xs text-base-content/50 hover:text-base-content/70"
							>
								ℹ {infos.length} Hinweis{infos.length === 1 ? '' : 'e'} (Schreibweise, nicht gefunden
								…)
							</summary>
							<ul
								class="mt-1 ml-1 flex list-inside list-disc flex-col gap-0.5 text-xs text-base-content/50"
							>
								{#each infos as w}
									<li>{w.message}</li>
								{/each}
							</ul>
						</details>
					{/if}
				</div>
			{:else}
				<div class="p-6 text-center text-sm text-base-content/50">
					Keine Prüfungen entsprechen dem Filter.
				</div>
			{/each}
		</div>
	{/if}
</div>
