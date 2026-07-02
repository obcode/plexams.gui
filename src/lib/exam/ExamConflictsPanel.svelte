<script>
	// Konflikt-Loop zum Terminplan: Konflikte des aktuellen Plans; pro Studierendem
	// einen Konflikt akzeptieren (Wiederholer etc.) und Parallelsektionen als
	// „darf zeitgleich" bestätigen. Prop-getrieben — jede Mutation aktualisiert
	// per invalidateAll die Load-Daten.
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';

	/** @type {any[]} */
	export let conflicts = [];
	/** @type {any[]} gespeicherte Per-Studierenden-Akzeptanzen */
	export let acceptances = [];
	/** @type {any[]} */
	export let suggestions = [];
	/** @type {any[]} */
	export let shareList = [];
	export let loadError = '';
	/** woher die angezeigten Konflikte stammen (Lauf-Snapshot vs. gespeichert) */
	export let sourceLabel = '';

	/** @param {number} a @param {number} b → reihenfolge-unabhängiger Schlüssel */
	const pairKey = (a, b) => [a, b].sort((x, y) => x - y).join('-');

	// Lokale, patchbare Kopie: die Konflikte können aus einem Lauf-Snapshot
	// (examReport.conflicts) kommen, der sich bei Bewertungen nicht von selbst
	// aktualisiert. Beim Wechsel der Quelle (neuer Lauf / frischer Load) neu
	// aufsetzen, dazwischen optimistisch patchen.
	/** @type {any[]} */
	let working = [];
	/** @type {any} */
	let seenRef;
	$: if (conflicts !== seenRef) {
		seenRef = conflicts;
		working = conflicts.map((/** @type {any} */ c) => ({
			...c,
			affectedStudents: (c.affectedStudents ?? []).map((/** @type {any} */ s) => ({ ...s }))
		}));
	}
	/** @param {number} a1 @param {number} a2 @param {(c:any)=>void} fn */
	function patch(a1, a2, fn) {
		const k = pairKey(a1, a2);
		const w = working.find((/** @type {any} */ c) => pairKey(c.ancode1, c.ancode2) === k);
		if (w) {
			fn(w);
			working = working;
		}
	}

	// infoOnly=true: beide Prüfungen extern (andere FK) → nichts änderbar, nur Info.
	$: ratable = working.filter((/** @type {any} */ c) => !c.infoOnly);
	$: infoConflicts = working.filter((/** @type {any} */ c) => c.infoOnly);

	// Konflikte enthalten nur noch SAME_SLOT/ADJACENT/SAME_DAY (kein NEXT_DAY mehr;
	// die Folgetag-Zahl steht rein informativ im Qualitäts-Panel, diagnostics.nextDay).
	const PROX = /** @type {Record<string, { label: string, cls: string }>} */ ({
		SAME_SLOT: { label: 'gleicher Slot', cls: 'badge-error' },
		ADJACENT: { label: 'direkt nacheinander', cls: 'badge-error' },
		SAME_DAY: { label: 'selber Tag', cls: 'badge-warning' }
	});

	let busy = '';
	let actionError = '';

	/** @param {string} path @param {any} body @param {string} key @param {(() => void)} [patchFn] */
	async function callMut(path, body, key, patchFn) {
		if (busy) return;
		busy = key;
		actionError = '';
		try {
			const res = await fetch(`/api/${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			// optimistisch die Anzeige aktualisieren (Lauf-Snapshot ändert sich
			// sonst nicht) und die Load-Daten (Vorschläge/Paare/Bewertungen) neu holen
			patchFn?.();
			await invalidateAll();
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			busy = '';
		}
	}

	/** @param {number} a1 @param {number} a2 */
	const allowShare = (a1, a2) =>
		callMut('setExamsCanShareSlot', { ancode1: a1, ancode2: a2 }, `s${pairKey(a1, a2)}`, () =>
			patch(a1, a2, (w) => (w.canShareSlot = true))
		);
	/** @param {number} a1 @param {number} a2 */
	const removeShare = (a1, a2) =>
		callMut('removeExamsCanShareSlot', { ancode1: a1, ancode2: a2 }, `s${pairKey(a1, a2)}`, () =>
			patch(a1, a2, (w) => (w.canShareSlot = false))
		);

	// aufgeklappte Konflikte (betroffene Studierende sichtbar)
	let expanded = new Set();
	/** @param {string} key */
	function toggleExpand(key) {
		const s = new Set(expanded);
		s.has(key) ? s.delete(key) : s.add(key);
		expanded = s;
	}
	// Per-Studierenden-Akzeptanz: nur die Nähe-Strafe dieses:r Studierenden
	// entfällt (zeitgleich bleibt hart verboten — nur canShareSlot hebt das auf).
	/** @param {any} w @param {string} mtknr @param {boolean} accepted */
	const patchStudent = (w, mtknr, accepted) => {
		const st = (w.affectedStudents ?? []).find((/** @type {any} */ x) => x.mtknr === mtknr);
		if (st) st.accepted = accepted;
	};
	/** @param {any} c @param {any} s */
	const acceptStudent = (c, s) =>
		callMut(
			'acceptStudentConflict',
			{ ancode1: c.ancode1, ancode2: c.ancode2, mtknr: s.mtknr },
			`a${pairKey(c.ancode1, c.ancode2)}-${s.mtknr}`,
			() => patch(c.ancode1, c.ancode2, (w) => patchStudent(w, s.mtknr, true))
		);
	/** @param {any} c @param {any} s */
	const unacceptStudent = (c, s) =>
		callMut(
			'removeStudentConflictAcceptance',
			{ ancode1: c.ancode1, ancode2: c.ancode2, mtknr: s.mtknr },
			`a${pairKey(c.ancode1, c.ancode2)}-${s.mtknr}`,
			() => patch(c.ancode1, c.ancode2, (w) => patchStudent(w, s.mtknr, false))
		);
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-baseline gap-2">
		<h2 class="text-xl font-semibold">Konflikte des aktuellen Plans</h2>
		<span class="badge badge-primary badge-lg tabular-nums">{working.length}</span>
		{#if sourceLabel}<span class="text-xs text-base-content/50">{sourceLabel}</span>{/if}
	</div>

	{#if loadError}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				Konflikte konnten nicht geladen werden — meist, weil noch kein Terminplan generiert wurde.
				<span class="font-mono text-xs opacity-70">{loadError}</span>
			</span>
		</div>
	{/if}

	{#if actionError}
		<div class="alert alert-error py-2 text-sm"><span>{actionError}</span></div>
	{/if}

	{#if ratable.length}
		<p class="max-w-3xl text-xs text-base-content/50">
			Nach Schwere sortiert. Studierendenzahl aufklappen, um einen Konflikt <strong>pro
			Studierendem</strong> zu akzeptieren (z. B. Wiederholer:innen) — das entfernt beim nächsten
			„Generieren" nur deren Nähe-Strafe. „darf zeitgleich" erlaubt Parallelsektionen denselben Slot
			(die harte Sperre und die Strafe entfallen) — das ist nur bei <strong>fehlerhafter Anmeldung</strong>
			sinnvoll, wenn der/die Studierende ohnehin nicht beide Prüfungen schreiben darf.
		</p>
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Nähe</th>
						<th>Prüfung 1</th>
						<th>Prüfung 2</th>
						<th class="text-right">Stud.</th>
						<th>gleicher Slot</th>
					</tr>
				</thead>
				<tbody>
					{#each ratable as c (pairKey(c.ancode1, c.ancode2))}
						{@const key = pairKey(c.ancode1, c.ancode2)}
						<tr class="hover">
							<td>
								<span class="badge badge-sm {PROX[c.proximity]?.cls ?? 'badge-ghost'}">
									{PROX[c.proximity]?.label ?? c.proximity}
								</span>
							</td>
							<td>
								<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode1}</div>
								<div class="font-medium">{c.module1}</div>
								<div class="text-xs text-base-content/60">{c.mainExamer1}</div>
								{#if (c.groups1 ?? []).length}
									<div class="mt-0.5 flex flex-wrap gap-1">
										{#each c.groups1 as g}<span class="badge badge-ghost badge-xs">{g}</span>{/each}
									</div>
								{/if}
							</td>
							<td>
								<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode2}</div>
								<div class="font-medium">{c.module2}</div>
								<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
								{#if (c.groups2 ?? []).length}
									<div class="mt-0.5 flex flex-wrap gap-1">
										{#each c.groups2 as g}<span class="badge badge-ghost badge-xs">{g}</span>{/each}
									</div>
								{/if}
							</td>
							<td class="text-right tabular-nums">
							<button
								class="btn btn-ghost btn-xs gap-1"
								on:click={() => toggleExpand(key)}
								title="betroffene Studierende anzeigen"
							>
								{c.studentCount}
								<span class="text-base-content/40">{expanded.has(key) ? '▲' : '▼'}</span>
							</button>
						</td>
							<td>
								{#if c.canShareSlot}
									<div class="flex items-center gap-1">
										<span class="badge badge-success badge-sm">darf zeitgleich</span>
										<WriteButton
											class="btn btn-ghost btn-xs text-error"
											disabled={busy === `s${key}`}
											title="zurücknehmen"
											on:click={() => removeShare(c.ancode1, c.ancode2)}
										>
											✕
										</WriteButton>
									</div>
								{:else}
									<WriteButton
										class="btn btn-ghost btn-xs"
										disabled={busy === `s${key}`}
										title="nur bei fehlerhafter Anmeldung sinnvoll — wenn der/die Studierende ohnehin nicht beide Prüfungen schreiben darf"
										on:click={() => allowShare(c.ancode1, c.ancode2)}
									>
										＋ erlauben
									</WriteButton>
								{/if}
							</td>
						</tr>
						{#if expanded.has(key)}
							<tr class="bg-base-200/40">
								<td colspan="5">
									<div class="flex flex-col gap-1 py-1">
										<span class="text-xs font-medium text-base-content/60">
											Betroffene Studierende — „akzeptieren" nimmt nur die Nähe-Strafe dieses:r
											Studierenden heraus (zeitgleich bleibt hart verboten; nur „darf zeitgleich"
											hebt das auf).
										</span>
										{#each c.affectedStudents ?? [] as s}
											<div class="flex flex-wrap items-center gap-2 text-sm">
												{#if s.accepted}
													<span class="badge badge-success badge-sm">akzeptiert</span>
												{/if}
												<span class="font-mono text-xs tabular-nums text-base-content/50">
													{s.mtknr}
												</span>
												<span>{s.name}</span>
												<span class="badge badge-ghost badge-xs tabular-nums" title="Kohorte des Studierenden">{s.program}{s.group}</span>
												{#if s.accepted}
													<WriteButton
														class="btn btn-ghost btn-xs text-error"
														disabled={busy === `a${key}-${s.mtknr}`}
														on:click={() => unacceptStudent(c, s)}
													>
														zurücknehmen
													</WriteButton>
												{:else}
													<WriteButton
														class="btn btn-outline btn-xs"
														disabled={busy === `a${key}-${s.mtknr}`}
														on:click={() => acceptStudent(c, s)}
													>
														akzeptieren
													</WriteButton>
												{/if}
											</div>
										{:else}
											<span class="text-sm text-base-content/50">— keine Studierenden gelistet</span>
										{/each}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if !ratable.length && !infoConflicts.length && !loadError}
		<div class="text-sm text-base-content/50">Keine Konflikte im aktuellen Plan.</div>
	{/if}

	<!-- Nur-Info-Konflikte: beide Prüfungen extern → nichts änderbar -->
	{#if infoConflicts.length}
		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title text-sm font-medium">
				Nur zur Info – betrifft jeweils zwei externe Prüfungen
				<span class="badge badge-ghost badge-sm ml-1 tabular-nums">{infoConflicts.length}</span>
			</summary>
			<div class="collapse-content flex flex-col gap-2 opacity-80">
				<p class="max-w-3xl text-xs text-base-content/50">
					Beide Prüfungen werden von anderen Fakultäten geplant — hier nichts änderbar. (Weitergabe
					an die zuständigen Planer:innen folgt später.)
				</p>
				<div class="overflow-x-auto rounded-lg border border-base-200">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Nähe</th>
							<th>Prüfung 1</th>
							<th>Prüfung 2</th>
							<th class="text-right">Stud.</th>
						</tr>
					</thead>
					<tbody>
						{#each infoConflicts as c (pairKey(c.ancode1, c.ancode2))}
							{@const key = `i${pairKey(c.ancode1, c.ancode2)}`}
							<tr class="hover">
								<td>
									<span class="badge badge-sm {PROX[c.proximity]?.cls ?? 'badge-ghost'}">
										{PROX[c.proximity]?.label ?? c.proximity}
									</span>
								</td>
								<td>
									<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode1}</div>
									<div class="font-medium">{c.module1}</div>
									<div class="text-xs text-base-content/60">{c.mainExamer1}</div>
									{#if (c.groups1 ?? []).length}
										<div class="mt-0.5 flex flex-wrap gap-1">
											{#each c.groups1 as g}<span class="badge badge-ghost badge-xs">{g}</span>{/each}
										</div>
									{/if}
								</td>
								<td>
									<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode2}</div>
									<div class="font-medium">{c.module2}</div>
									<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
									{#if (c.groups2 ?? []).length}
										<div class="mt-0.5 flex flex-wrap gap-1">
											{#each c.groups2 as g}<span class="badge badge-ghost badge-xs">{g}</span>{/each}
										</div>
									{/if}
								</td>
								<td class="text-right tabular-nums">
									<button
										class="btn btn-ghost btn-xs gap-1"
										on:click={() => toggleExpand(key)}
										title="betroffene Studierende anzeigen"
									>
										{c.studentCount}
										<span class="text-base-content/40">{expanded.has(key) ? '▲' : '▼'}</span>
									</button>
								</td>
							</tr>
							{#if expanded.has(key)}
								<tr class="bg-base-200/40">
									<td colspan="4">
										<div class="flex flex-wrap gap-x-4 gap-y-1 py-1 text-sm">
											{#each c.affectedStudents ?? [] as s}
												<span>
													<span class="font-mono text-xs tabular-nums text-base-content/50">{s.mtknr}</span>
													{s.name}
													<span class="badge badge-ghost badge-xs tabular-nums" title="Kohorte des Studierenden">{s.program}{s.group}</span>
												</span>
											{:else}
												<span class="text-base-content/50">— keine Studierenden gelistet</span>
											{/each}
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
		</details>
	{/if}

	<!-- canShareSlot-Vorschläge (erkannte Parallelsektionen) -->
	{#if suggestions.length}
		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title text-sm font-medium">
				Vorschläge „darf zeitgleich" (Parallelsektionen)
				<span class="font-normal text-base-content/50">· {suggestions.length}</span>
			</summary>
			<div class="collapse-content">
				<div class="overflow-x-auto rounded-lg border border-base-200">
					<table class="table table-sm">
						<thead>
							<tr><th>Prüfung 1</th><th>Prüfung 2</th><th></th></tr>
						</thead>
						<tbody>
							{#each suggestions as s (pairKey(s.ancode1, s.ancode2))}
								{@const key = pairKey(s.ancode1, s.ancode2)}
								<tr class="hover">
									<td>
										<span class="font-mono text-xs tabular-nums text-base-content/60">{s.ancode1}</span>
										{s.module1}
										<span class="text-xs text-base-content/50">· {s.mainExamer1}</span>
									</td>
									<td>
										<span class="font-mono text-xs tabular-nums text-base-content/60">{s.ancode2}</span>
										{s.module2}
										<span class="text-xs text-base-content/50">· {s.mainExamer2}</span>
									</td>
									<td class="text-right">
										<WriteButton
											class="btn btn-primary btn-xs"
											disabled={busy === `s${key}`}
											on:click={() => allowShare(s.ancode1, s.ancode2)}
										>
											bestätigen
										</WriteButton>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</details>
	{/if}

	<!-- bestätigte „darf zeitgleich"-Paare -->
	{#if shareList.length}
		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title text-sm font-medium">
				Bestätigt „darf zeitgleich"
				<span class="font-normal text-base-content/50">· {shareList.length}</span>
			</summary>
			<div class="collapse-content">
				<div class="flex flex-col gap-1">
					{#each shareList as s (pairKey(s.ancode1, s.ancode2))}
						{@const key = pairKey(s.ancode1, s.ancode2)}
						<div class="flex flex-wrap items-center gap-2 text-sm">
							<span class="badge badge-success badge-sm">zeitgleich erlaubt</span>
							<span class="font-mono tabular-nums text-base-content/60">{s.ancode1}</span>
							<span>{s.module1}</span>
							<span class="text-base-content/40">↔</span>
							<span class="font-mono tabular-nums text-base-content/60">{s.ancode2}</span>
							<span>{s.module2}</span>
							<WriteButton
								class="btn btn-ghost btn-xs text-error"
								disabled={busy === `s${key}`}
								on:click={() => removeShare(s.ancode1, s.ancode2)}
							>
								entfernen
							</WriteButton>
						</div>
					{/each}
				</div>
			</div>
		</details>
	{/if}

	<!-- alle gespeicherten Per-Studierenden-Akzeptanzen -->
	{#if acceptances.length}
		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title text-sm font-medium">
				Akzeptierte Konflikte (pro Studierendem)
				<span class="font-normal text-base-content/50">· {acceptances.length}</span>
			</summary>
			<div class="collapse-content">
				<div class="overflow-x-auto rounded-lg border border-base-200">
					<table class="table table-sm">
						<thead>
							<tr><th>Prüfung 1</th><th>Prüfung 2</th><th>Studierende:r (Mtknr)</th></tr>
						</thead>
						<tbody>
							{#each acceptances as a}
								<tr>
									<td class="font-mono tabular-nums">{a.ancode1}</td>
									<td class="font-mono tabular-nums">{a.ancode2}</td>
									<td class="font-mono text-sm tabular-nums text-base-content/60">{a.mtknr}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</details>
	{/if}
</div>
