<script>
	let { data } = $props();
	/** @param {string} program @param {number} primussAncode */
	const examInfo = (program, primussAncode) => data.examByKey?.[`${program}/${primussAncode}`];

	let q = $state('');
	/** @type {any[]} */
	let students = $state([]);
	let loading = $state(false);
	let error = $state('');
	let searched = $state(false);

	async function search() {
		const term = q.trim();
		if (!term || loading) return;
		loading = true;
		error = '';
		// reine Ziffern → Matrikelnummer, sonst Namens-Regex
		const body = /^\d+$/.test(term) ? { mtknr: term } : { regex: term };
		try {
			const res = await fetch('/api/primuss/students', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				error = d?.error || `Fehler (HTTP ${res.status})`;
				students = [];
				return;
			}
			students = d.students ?? [];
			searched = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	/** @param {KeyboardEvent} e */
	const onEnter = (e) => e.key === 'Enter' && search();
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Studierende</h1>
		{#if searched}
			<span class="badge badge-primary badge-lg tabular-nums">{students.length}</span>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<input
			class="input input-bordered input-sm w-72"
			type="text"
			bind:value={q}
			onkeydown={onEnter}
			placeholder="Name (Regex) oder Matrikelnummer …"
		/>
		<button class="btn btn-primary btn-sm" disabled={loading || !q.trim()} onclick={search}>
			{loading ? 'sucht …' : 'Suchen'}
		</button>
		<span class="text-xs text-base-content/40"
			>reine Ziffern = Matrikelnummer, sonst Name (Regex)</span
		>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	{#if searched && students.length === 0 && !error}
		<div class="p-6 text-center text-sm text-base-content/50">Keine Treffer.</div>
	{/if}

	<div class="flex flex-col gap-1.5">
		{#each students as s (s.mtknr)}
			<div class="flex flex-wrap items-start gap-x-6 gap-y-2 rounded-lg border border-base-200 p-3">
				<!-- Person -->
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-baseline gap-x-2">
						<span class="font-mono text-base font-semibold tabular-nums">{s.mtknr}</span>
						<span class="font-medium">{s.name}</span>
						{#if s.nta}<span class="badge badge-info badge-sm" title="Nachteilsausgleich">NTA</span
							>{/if}
					</div>
					<div class="text-sm text-base-content/70">
						{s.program}{s.group ? ` · ${s.group}` : ''}
						{#if s.zpaStudent?.email}
							· <span class="text-base-content/50">{s.zpaStudent.email}</span>
						{/if}
					</div>
					{#if s.nta}
						<div class="mt-1 flex flex-wrap items-center gap-1 text-xs">
							{#if s.nta.deltaDurationPercent}<span class="badge badge-ghost badge-sm"
									>+{s.nta.deltaDurationPercent}%</span
								>{/if}
							{#if s.nta.needsRoomAlone}<span class="badge badge-warning badge-sm">Einzelraum</span
								>{/if}
							{#if s.nta.compensation}<span class="text-base-content/60">{s.nta.compensation}</span
								>{/if}
						</div>
					{/if}
				</div>

				<!-- Anmeldungen -->
				<div class="min-w-0 flex-1">
					<div class="mb-1 text-xs font-medium text-base-content/50">
						Anmeldungen ({(s.regsWithProgram ?? s.zpaAncodes ?? []).length})
					</div>
					{#if (s.regsWithProgram ?? []).length}
						<div class="flex flex-col gap-0.5">
							{#each s.regsWithProgram as r}
								{@const info = examInfo(r.program, r.primussAncode)}
								<div class="flex flex-wrap items-baseline gap-x-2 text-sm">
									<span class="badge badge-ghost badge-sm tabular-nums"
										>{r.program}/{r.primussAncode}</span
									>
									{#if r.zpaAncode != null && r.zpaAncode !== r.primussAncode}
										<span
											class="badge badge-outline badge-sm tabular-nums"
											title="interner ZPA-Ancode">ZPA {r.zpaAncode}</span
										>
									{/if}
									{#if info}
										<span>{info.module}</span>
										<span class="text-base-content/50">· {info.mainExamer}</span>
									{:else}
										<span class="text-base-content/30">— Modul unbekannt</span>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex flex-wrap gap-1">
							{#each s.zpaAncodes ?? [] as a}
								<span class="badge badge-ghost badge-sm tabular-nums">{a}</span>
							{:else}
								<span class="text-base-content/40">—</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
