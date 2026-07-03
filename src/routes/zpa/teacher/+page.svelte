<script>
	import { run } from 'svelte/legacy';

	let { data } = $props();

	// Gestreamte Load-Daten: Seite rendert sofort, Tabelle füllt sich nach.
	/** @type {any[]} */
	let teachers = $state([]);
	/** @type {Record<number, boolean>} */
	let invigById = $state({});
	let invigilatorCount = $state(0);
	let missingReqCount = $state(0);
	/** @type {string | null} */
	let currentSemester = $state(null);
	let loading = $state(true);
	run(() => {
		data.people.then((/** @type {any} */ p) => {
			teachers = p.teachers;
			invigById = p.invigById;
			invigilatorCount = p.invigilatorCount;
			missingReqCount = p.missingReqCount;
			currentSemester = p.currentSemester;
			loading = false;
		});
	});

	let searchTerm = $state('');
	let onlyInvigilators = $state(false);
	let onlyMissingReq = $state(false);
	let groupBySemester = $state(true);

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

	let term = $derived(searchTerm.trim().toLowerCase());
	let rows = $derived(teachers.filter((/** @type {any} */ t) => {
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
	}));

	// Chronologischer Schlüssel für „YYYY SS"/„YYYY WS" (SS vor WS); null = unbekannt.
	/** @param {string | null | undefined} s */
	function semKey(s) {
		const m = /^(\d{4})\s*(SS|WS)$/i.exec((s ?? '').trim());
		if (!m) return null;
		return Number(m[1]) * 2 + (m[2].toUpperCase() === 'SS' ? 0 : 1);
	}

	// In Abschnitte nach letztem Semester aufteilen. Absteigend (neueste zuerst),
	// unbekannte (z. B. „unknown") ganz unten. Einträge, die NEUER als das aktuelle
	// Semester sind, werden ins aktuelle gefaltet und pro Person markiert (_newer).
	/** @param {any[]} items @param {boolean} grouped @param {string | null} current
	 * @returns {{ key: string, label: string | null, sortKey: number, items: any[] }[]} */
	function buildSections(items, grouped, current) {
		if (!grouped) return [{ key: '__all__', label: null, sortKey: 0, items }];
		const cur = semKey(current);
		/** @type {Map<string, { key: string, label: string, sortKey: number, items: any[] }>} */
		const m = new Map();
		for (const t of items) {
			const k = semKey(t.lastSemester);
			let key, label, sortKey;
			let entry = t;
			if (k != null && cur != null && k > cur && current) {
				// neuer als aktuell → ins aktuelle Semester falten, markieren
				key = current;
				label = current;
				sortKey = cur;
				entry = { ...t, _newer: t.lastSemester };
			} else if (k == null) {
				const raw = (t.lastSemester ?? '').trim();
				key = raw || '__none__';
				label = raw || 'unbekannt';
				sortKey = Number.NEGATIVE_INFINITY;
			} else {
				key = t.lastSemester;
				label = t.lastSemester;
				sortKey = k;
			}
			let g = m.get(key);
			if (!g) {
				g = { key, label, sortKey, items: [] };
				m.set(key, g);
			}
			g.items.push(entry);
		}
		return [...m.values()].sort((a, b) =>
			a.sortKey !== b.sortKey ? b.sortKey - a.sortKey : a.label.localeCompare(b.label)
		);
	}
	let sections = $derived(buildSections(rows, groupBySemester, currentSemester));

	// Einklappen: nur die neueste Sektion offen; bei aktiver Suche alles offen.
	/** @type {Set<string>} */
	let openSections = $state(new Set());
	let openInit = $state(false);
	run(() => {
		if (!loading && groupBySemester && !openInit && sections.length) {
			openSections = new Set([sections[0].key]);
			openInit = true;
		}
	});
	// open/t als Argumente, damit das Template auf openSections/term reagiert.
	/** @param {{ key: string, label: string | null }} sec @param {Set<string>} open @param {string} t */
	const isOpen = (sec, open, t) => sec.label === null || !!t || open.has(sec.key);
	/** @param {string} key */
	function toggleSection(key) {
		const s = new Set(openSections);
		if (s.has(key)) s.delete(key);
		else s.add(key);
		openSections = s;
	}
	const expandAll = () => (openSections = new Set(sections.map((s) => s.key)));
	const collapseAll = () => (openSections = new Set());
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
			{#if currentSemester}
				<span class="text-sm text-base-content/50">aktuelles Semester: {currentSemester}</span>
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
		{#if groupBySemester && !term}
			<div class="flex gap-1">
				<button class="btn btn-ghost btn-xs" onclick={expandAll}>alle ausklappen</button>
				<button class="btn btn-ghost btn-xs" onclick={collapseAll}>alle einklappen</button>
			</div>
		{/if}
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
						{#if sec.label !== null}
							<tr class="bg-base-200/60">
								<td colspan="6" class="p-0">
									<button
										class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold hover:bg-base-200"
										onclick={() => toggleSection(sec.key)}
									>
										<span class="text-base-content/50"
											>{isOpen(sec, openSections, term) ? '▾' : '▸'}</span
										>
										letztes Semester: {sec.label}
										<span class="badge badge-ghost badge-sm tabular-nums">{sec.items.length}</span>
										{#if sec.items.some((/** @type {any} */ i) => i._newer)}
											<span class="badge badge-info badge-xs" title="enthält neuere Semester">
												inkl. neuere
											</span>
										{/if}
									</button>
								</td>
							</tr>
						{/if}
						{#if isOpen(sec, openSections, term)}
							{#each sec.items as t (t.id)}
								{@const s = invigStatus(t)}
								<tr class="hover">
									<td>
										<div class="flex items-center gap-2">
											<span class="font-medium">{t.shortname}</span>
											{#if t._newer}
												<span class="badge badge-info badge-xs" title="letztes Semester laut ZPA">
													{t._newer}
												</span>
											{/if}
										</div>
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
											<span class="badge badge-warning badge-sm"
												>Aufsicht · Anforderungen fehlen</span
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
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
