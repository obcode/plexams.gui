<script>
	export let data;

	// Gestreamte Load-Daten: Seite rendert sofort, Tabelle füllt sich nach.
	/** @type {any[]} */
	let teachers = [];
	/** @type {Record<number, boolean>} */
	let invigById = {};
	let invigilatorCount = 0;
	let missingReqCount = 0;
	let loading = true;
	$: data.people.then((/** @type {any} */ p) => {
		teachers = p.teachers;
		invigById = p.invigById;
		invigilatorCount = p.invigilatorCount;
		missingReqCount = p.missingReqCount;
		loading = false;
	});

	let searchTerm = '';
	let onlyInvigilators = false;
	let onlyMissingReq = false;
	let groupBySemester = true;

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
		Object.prototype.hasOwnProperty.call(invigById, t.id)
			? { isInvig: true, submitted: invigById[t.id] }
			: { isInvig: false, submitted: false };

	$: term = searchTerm.trim().toLowerCase();
	$: rows = teachers.filter((/** @type {any} */ t) => {
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

	// In Abschnitte nach letztem Semester aufteilen (absteigend, „—" zuletzt).
	// Ohne Gruppierung: ein Abschnitt ohne Kopfzeile.
	/** @param {any[]} items @param {boolean} grouped
	 * @returns {{ semester: string | null, items: any[] }[]} */
	function buildSections(items, grouped) {
		if (!grouped) return [{ semester: null, items }];
		/** @type {Map<string, any[]>} */
		const m = new Map();
		for (const t of items) {
			const key = t.lastSemester || '—';
			if (!m.has(key)) m.set(key, []);
			m.get(key)?.push(t);
		}
		const keys = [...m.keys()].sort((a, b) =>
			a === '—' ? 1 : b === '—' ? -1 : b.localeCompare(a)
		);
		return keys.map((k) => ({ semester: k, items: m.get(k) ?? [] }));
	}
	$: sections = buildSections(rows, groupBySemester);
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Dozierende &amp; Aufsichten</h1>
		{#if loading}
			<span class="loading loading-spinner loading-sm text-base-content/50"></span>
		{:else}
			<span class="badge badge-primary badge-lg tabular-nums" title="Dozierende gesamt">
				{teachers.length}
			</span>
			<span class="badge badge-neutral badge-lg tabular-nums" title="davon Aufsichten">
				{invigilatorCount} Aufsichten
			</span>
			{#if missingReqCount > 0}
				<span class="badge badge-warning badge-lg tabular-nums">
					{missingReqCount} ohne Anforderungen
				</span>
			{/if}
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
		<label class="label cursor-pointer gap-2">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={groupBySemester} />
			<span class="label-text">nach letztem Semester</span>
		</label>
		<div class="flex-1"></div>
		{#if !loading}
			<span class="tabular-nums text-sm text-base-content/50">{rows.length} angezeigt</span>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center gap-2 text-sm text-base-content/50">
			<span class="loading loading-spinner loading-sm"></span> lädt …
		</div>
	{:else if rows.length === 0}
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
					{#each sections as sec}
						{#if sec.semester !== null}
							<tr class="bg-base-200/60">
								<td colspan="6" class="text-sm font-semibold">
									{sec.semester === '—'
										? 'ohne „letztes Semester“'
										: `letztes Semester: ${sec.semester}`}
									<span class="badge badge-ghost badge-sm ml-2 tabular-nums"
										>{sec.items.length}</span
									>
								</td>
							</tr>
						{/if}
						{#each sec.items as t (t.id)}
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
										<span class="badge badge-warning badge-sm">Aufsicht · Anforderungen fehlen</span
										>
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
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
