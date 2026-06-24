<script>
	export let data;

	let searchTerm = '';
	let onlyInvigilators = false;
	let onlyMissingReq = false;

	/** @param {any} t */
	function roles(t) {
		/** @type {string[]} */
		const r = [];
		if (t.isProf) r.push('Prof');
		if (t.isProfHC) r.push('Prof (HC)');
		if (t.isLBA) r.push('LBA');
		if (t.isStaff) r.push('Staff');
		return r;
	}

	// Aufsichts-Status je Person: present in invigById = ist Aufsicht, Wert = Anforderungen abgegeben?
	/** @param {any} t */
	const invigStatus = (t) =>
		Object.prototype.hasOwnProperty.call(data.invigById, t.id)
			? { isInvig: true, submitted: data.invigById[t.id] }
			: { isInvig: false, submitted: false };

	$: term = searchTerm.trim().toLowerCase();
	$: rows = data.teachers.filter((/** @type {any} */ t) => {
		if (term) {
			const hit =
				t.fullname.toLowerCase().includes(term) ||
				(t.shortname ?? '').toLowerCase().includes(term) ||
				String(t.id).includes(term);
			if (!hit) return false;
		}
		const s = invigStatus(t);
		if (onlyMissingReq) return s.isInvig && !s.submitted;
		if (onlyInvigilators) return s.isInvig;
		return true;
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Dozierende &amp; Aufsichten</h1>
		<span class="badge badge-primary badge-lg tabular-nums" title="Dozierende gesamt">
			{data.teachers.length}
		</span>
		<span class="badge badge-neutral badge-lg tabular-nums" title="davon Aufsichten">
			{data.invigilatorCount} Aufsichten
		</span>
		{#if data.missingReqCount > 0}
			<span class="badge badge-warning badge-lg tabular-nums">
				{data.missingReqCount} ohne Anforderungen
			</span>
		{/if}
	</div>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-4 rounded-lg border border-base-300 bg-base-100 p-3">
		<input
			class="input input-bordered input-sm w-72"
			type="text"
			bind:value={searchTerm}
			placeholder="Suche (Name, Kürzel oder ID)"
		/>
		<label class="label cursor-pointer gap-2">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyInvigilators} />
			<span class="label-text">nur Aufsichten</span>
		</label>
		<label class="label cursor-pointer gap-2">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyMissingReq} />
			<span class="label-text">nur ohne Anforderungen</span>
		</label>
		<div class="flex-1"></div>
		<span class="tabular-nums text-sm text-base-content/50">{rows.length} angezeigt</span>
	</div>

	{#if rows.length === 0}
		<div class="text-sm text-base-content/50">Keine Treffer.</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Person</th>
						<th>FK</th>
						<th>Rolle</th>
						<th>Aufsicht</th>
						<th>E-Mail</th>
						<th class="text-right">ID</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as t (t.id)}
						{@const s = invigStatus(t)}
						<tr class="hover">
							<td>
								<div class="font-medium">{t.shortname}</div>
								<div class="text-xs text-base-content/50">{t.fullname}</div>
							</td>
							<td class="text-sm text-base-content/70">{t.fk || '—'}</td>
							<td>
								<div class="flex flex-wrap gap-1">
									{#each roles(t) as role}
										<span class="badge badge-ghost badge-sm">{role}</span>
									{:else}
										<span class="text-base-content/40">—</span>
									{/each}
								</div>
							</td>
							<td>
								{#if !s.isInvig}
									<span class="text-base-content/40">—</span>
								{:else if s.submitted}
									<span class="badge badge-success badge-sm">Aufsicht ✓</span>
								{:else}
									<span class="badge badge-warning badge-sm">Aufsicht · Anforderungen fehlen</span>
								{/if}
							</td>
							<td>
								{#if t.email}
									<a class="link link-hover text-sm" href="mailto:{t.email}">{t.email}</a>
								{:else}
									<span class="text-base-content/40">—</span>
								{/if}
							</td>
							<td class="text-right font-mono text-xs text-base-content/50">{t.id}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
