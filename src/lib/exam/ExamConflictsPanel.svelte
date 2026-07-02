<script>
	// Konflikt-Bewertungs-Loop zum Terminplan: Konflikte des aktuellen Plans
	// bewerten (akzeptiert/unerwünscht/unzulässig) und Parallelsektionen als
	// „darf zeitgleich" bestätigen. Prop-getrieben — jede Mutation aktualisiert
	// per invalidateAll die Load-Daten.
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';

	/** @type {any[]} */
	export let conflicts = [];
	/** @type {any[]} */
	export let ratings = [];
	/** @type {any[]} */
	export let suggestions = [];
	/** @type {any[]} */
	export let shareList = [];
	export let loadError = '';

	/** @param {number} a @param {number} b → reihenfolge-unabhängiger Schlüssel */
	const pairKey = (a, b) => [a, b].sort((x, y) => x - y).join('-');

	// infoOnly=true: beide Prüfungen extern (andere FK) → nichts änderbar, nur Info.
	$: ratable = conflicts.filter((/** @type {any} */ c) => !c.infoOnly);
	$: infoConflicts = conflicts.filter((/** @type {any} */ c) => c.infoOnly);

	const PROX = /** @type {Record<string, { label: string, cls: string }>} */ ({
		SAME_SLOT: { label: 'gleicher Slot', cls: 'badge-error' },
		ADJACENT: { label: 'direkt nacheinander', cls: 'badge-error' },
		SAME_DAY: { label: 'selber Tag', cls: 'badge-warning' },
		NEXT_DAY: { label: 'Folgetag', cls: 'badge-info' }
	});
	const RATING_LABEL = /** @type {Record<string, string>} */ ({
		ACCEPTED: 'akzeptiert',
		UNDESIRED: 'unerwünscht',
		FORBIDDEN: 'unzulässig'
	});

	let busy = '';
	let actionError = '';

	/** @param {string} path @param {any} body @param {string} key */
	async function callMut(path, body, key) {
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
			await invalidateAll();
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			busy = '';
		}
	}

	/** @param {any} c @param {string} rating */
	const setRating = (c, rating) =>
		callMut(
			'setConflictRating',
			{ ancode1: c.ancode1, ancode2: c.ancode2, rating },
			`r${pairKey(c.ancode1, c.ancode2)}`
		);
	/** @param {any} c */
	const accept = (c) =>
		callMut(
			'removeConflictRating',
			{ ancode1: c.ancode1, ancode2: c.ancode2 },
			`r${pairKey(c.ancode1, c.ancode2)}`
		);
	/** @param {number} a1 @param {number} a2 */
	const allowShare = (a1, a2) =>
		callMut('setExamsCanShareSlot', { ancode1: a1, ancode2: a2 }, `s${pairKey(a1, a2)}`);
	/** @param {number} a1 @param {number} a2 */
	const removeShare = (a1, a2) =>
		callMut('removeExamsCanShareSlot', { ancode1: a1, ancode2: a2 }, `s${pairKey(a1, a2)}`);

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
	/** @param {any} c @param {any} s */
	const acceptStudent = (c, s) =>
		callMut(
			'setConflictRating',
			{ ancode1: c.ancode1, ancode2: c.ancode2, rating: 'ACCEPTED', mtknr: s.mtknr },
			`a${pairKey(c.ancode1, c.ancode2)}-${s.mtknr}`
		);
	/** @param {any} c @param {any} s */
	const unacceptStudent = (c, s) =>
		callMut(
			'removeConflictRating',
			{ ancode1: c.ancode1, ancode2: c.ancode2, mtknr: s.mtknr },
			`a${pairKey(c.ancode1, c.ancode2)}-${s.mtknr}`
		);
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-2">
		<h2 class="text-xl font-semibold">Konflikte des aktuellen Plans</h2>
		<span class="badge badge-primary badge-lg tabular-nums">{conflicts.length}</span>
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
			Nach Schwere sortiert. Bewertung wirkt beim nächsten „Generieren": <strong>unerwünscht</strong>
			zieht das Paar stärker auseinander, <strong>unzulässig</strong> erzwingt verschiedene Tage.
			„darf zeitgleich" erlaubt Parallelsektionen denselben Slot (die harte Sperre und die Strafe
			entfallen).
		</p>
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Nähe</th>
						<th>Prüfung 1</th>
						<th>Prüfung 2</th>
						<th class="text-right">Stud.</th>
						<th>Bewertung</th>
						<th>gleicher Slot</th>
					</tr>
				</thead>
				<tbody>
					{#each ratable as c (pairKey(c.ancode1, c.ancode2))}
						{@const key = pairKey(c.ancode1, c.ancode2)}
						{@const cur = c.rating ?? 'ACCEPTED'}
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
							</td>
							<td>
								<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode2}</div>
								<div class="font-medium">{c.module2}</div>
								<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
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
								<div class="join">
									<WriteButton
										class="btn join-item btn-xs {cur === 'ACCEPTED' ? 'btn-success' : 'btn-ghost'}"
										disabled={busy === `r${key}`}
										on:click={() => accept(c)}
									>
										akzeptiert
									</WriteButton>
									<WriteButton
										class="btn join-item btn-xs {cur === 'UNDESIRED' ? 'btn-warning' : 'btn-ghost'}"
										disabled={busy === `r${key}`}
										on:click={() => setRating(c, 'UNDESIRED')}
									>
										unerwünscht
									</WriteButton>
									<WriteButton
										class="btn join-item btn-xs {cur === 'FORBIDDEN' ? 'btn-error' : 'btn-ghost'}"
										disabled={busy === `r${key}`}
										on:click={() => setRating(c, 'FORBIDDEN')}
									>
										unzulässig
									</WriteButton>
								</div>
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
										on:click={() => allowShare(c.ancode1, c.ancode2)}
									>
										＋ erlauben
									</WriteButton>
								{/if}
							</td>
						</tr>
						{#if expanded.has(key)}
							<tr class="bg-base-200/40">
								<td colspan="6">
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
								</td>
								<td>
									<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode2}</div>
									<div class="font-medium">{c.module2}</div>
									<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
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

	<!-- alle gespeicherten Bewertungen -->
	{#if ratings.length}
		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title text-sm font-medium">
				Alle gespeicherten Bewertungen
				<span class="font-normal text-base-content/50">· {ratings.length}</span>
			</summary>
			<div class="collapse-content">
				<div class="overflow-x-auto rounded-lg border border-base-200">
					<table class="table table-sm">
						<thead>
							<tr><th>Prüfung 1</th><th>Prüfung 2</th><th>Bewertung</th><th>Studierende:r</th></tr>
						</thead>
						<tbody>
							{#each ratings as r}
								<tr>
									<td class="font-mono tabular-nums">{r.ancode1}</td>
									<td class="font-mono tabular-nums">{r.ancode2}</td>
									<td>
										<span
											class="badge badge-sm {r.rating === 'FORBIDDEN'
												? 'badge-error'
												: r.rating === 'UNDESIRED'
													? 'badge-warning'
													: 'badge-ghost'}"
										>
											{RATING_LABEL[r.rating] ?? r.rating}
										</span>
									</td>
									<td class="text-sm text-base-content/60">{r.mtknr || 'ganzes Paar'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</details>
	{/if}
</div>
