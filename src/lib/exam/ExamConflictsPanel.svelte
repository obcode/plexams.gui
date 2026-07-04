<script>
	// Konflikt-Loop zum Terminplan: Konflikte des aktuellen Plans; pro Studierendem
	// einen Konflikt akzeptieren (Wiederholer etc.) und Parallelsektionen als
	// „darf zeitgleich" bestätigen. Prop-getrieben — jede Mutation aktualisiert
	// per invalidateAll die Load-Daten.
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import { diffMeta } from '$lib/exam/conflictDiff';
	import { pairKey, isAutoConflict } from '$lib/exam/conflictLoop';

	/**
	 * @typedef {Object} Props
	 * @property {any[]} [conflicts]
	 * @property {any[]} [decisions]
	 * @property {any[]} [suggestions]
	 * @property {any[]} [shareList]
	 * @property {any[]} [resolvedConflicts]
	 * @property {string} [loadError]
	 * @property {string} [sourceLabel] - woher die angezeigten Konflikte stammen (Lauf-Snapshot vs. gespeichert)
	 */

	/** @type {Props} */
	let {
		conflicts = [],
		decisions = [],
		suggestions = [],
		shareList = [],
		resolvedConflicts = [],
		loadError = '',
		sourceLabel = ''
	} = $props();

	// pairKey/isAutoConflict leben in $lib/exam/conflictLoop (unit-getestet).

	// Lokale, patchbare Kopie als writable $derived: folgt dem `conflicts`-Prop
	// (Lauf-Snapshot examReport.conflicts oder frischer Load) und wird bei jedem
	// invalidateAll neu aufgesetzt; dazwischen optimistisch per Reassignment
	// gepatcht. $derived läuft — anders als $effect — auch bei SSR, sodass die
	// Konflikte schon im SSR-HTML stehen.
	/** @type {any[]} */
	let working = $derived(
		conflicts.map((/** @type {any} */ c) => ({
			...c,
			affectedStudents: (c.affectedStudents ?? []).map((/** @type {any} */ s) => ({ ...s }))
		}))
	);
	/** Genau einen Konflikt (per Paar-Schlüssel) optimistisch ersetzen — Reassignment
	 * statt In-place-Mutation, damit das writable $derived reaktiv bleibt.
	 * @param {number} a1 @param {number} a2 @param {(c:any)=>void} fn */
	function patch(a1, a2, fn) {
		const k = pairKey(a1, a2);
		working = working.map((/** @type {any} */ c) => {
			if (pairKey(c.ancode1, c.ancode2) !== k) return c;
			const copy = {
				...c,
				affectedStudents: (c.affectedStudents ?? []).map((/** @type {any} */ s) => ({ ...s }))
			};
			fn(copy);
			return copy;
		});
	}

	// Konflikte enthalten nur noch SAME_SLOT/ADJACENT/SAME_DAY (kein NEXT_DAY mehr;
	// die Folgetag-Zahl steht rein informativ im Qualitäts-Panel, diagnostics.nextDay).
	const PROX = /** @type {Record<string, { label: string, cls: string }>} */ ({
		SAME_SLOT: { label: 'gleicher Slot', cls: 'badge-error' },
		ADJACENT: { label: 'direkt nacheinander', cls: 'badge-error' },
		SAME_DAY: { label: 'selber Tag', cls: 'badge-warning' }
	});

	let busy = $state('');
	let actionError = $state('');

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
	let expanded = $state(new Set());
	/** @param {string} key */
	function toggleExpand(key) {
		const s = new Set(expanded);
		if (s.has(key)) s.delete(key);
		else s.add(key);
		expanded = s;
	}
	// Slot-Zeit (Berlin) je Prüfung, z. B. „Fr 24.07., 08:30".
	/** @param {any} slot */
	const fmtSlot = (slot) => {
		const iso = slot?.starttime;
		if (!iso) return '';
		const d = new Date(iso);
		return Number.isNaN(d.getTime())
			? ''
			: d.toLocaleString('de-DE', {
					timeZone: 'Europe/Berlin',
					weekday: 'short',
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
	};

	// Per-Studierenden-Entscheidung: ACCEPT (Konflikt akzeptieren) oder VETO
	// (automatische Akzeptanz bei Wiederholung/gleichem Slot aufheben). accepted =
	// effektiver
	// Zustand (ACCEPT oder auto ohne Veto).
	/** @param {any} st */
	const isAccepted = (st) =>
		st.decision === 'ACCEPT' || (st.autoAccepted && st.decision !== 'VETO');
	/** @param {any} w @param {string} mtknr @param {string|null} decision */
	const patchDecision = (w, mtknr, decision) => {
		const st = (w.affectedStudents ?? []).find((/** @type {any} */ x) => x.mtknr === mtknr);
		if (st) {
			st.decision = decision;
			st.accepted = isAccepted(st);
		}
	};
	/** @param {any} c @param {any} s @param {'ACCEPT'|'VETO'} decision */
	const decide = (c, s, decision) =>
		callMut(
			'setStudentConflictDecision',
			{ ancode1: c.ancode1, ancode2: c.ancode2, mtknr: s.mtknr, decision },
			`a${pairKey(c.ancode1, c.ancode2)}-${s.mtknr}`,
			() => patch(c.ancode1, c.ancode2, (w) => patchDecision(w, s.mtknr, decision))
		);
	/** @param {any} c @param {any} s */
	const clearDecision = (c, s) =>
		callMut(
			'removeStudentConflictDecision',
			{ ancode1: c.ancode1, ancode2: c.ancode2, mtknr: s.mtknr },
			`a${pairKey(c.ancode1, c.ancode2)}-${s.mtknr}`,
			() => patch(c.ancode1, c.ancode2, (w) => patchDecision(w, s.mtknr, null))
		);
	// diffMeta (Konflikt-Diff-Anzeige) lebt in $lib/exam/conflictDiff und ist dort
	// unit-getestet. Gibt es überhaupt Diff-Infos? (dann Legende zeigen)
	let hasDiff = $derived(
		resolvedConflicts.length > 0 || working.some((/** @type {any} */ c) => diffMeta(c.diffStatus))
	);
	// infoOnly=true: beide Prüfungen extern (andere FK) → nichts änderbar, nur Info.
	let ratable = $derived(working.filter((/** @type {any} */ c) => !c.infoOnly));
	let infoConflicts = $derived(working.filter((/** @type {any} */ c) => c.infoOnly));
	// „auto" = alle betroffenen Studierenden sind autoAccepted (Wiederholer oder
	// gleicher Slot — niemand schreibt beide) →
	// separate, eingeklappte Section. „nicht-auto" (mind. ein:e Studierende:r
	// braucht eine Entscheidung) oben und offen.
	let ratableNonAuto = $derived(ratable.filter((/** @type {any} */ c) => !isAutoConflict(c)));
	let ratableAuto = $derived(ratable.filter(isAutoConflict));
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

	{#if hasDiff}
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
			<span class="font-medium text-base-content/70">Diff zum vorigen Plan:</span>
			<span class="flex items-center gap-1"
				><span class="badge badge-error badge-xs">neu</span> hinzugekommen</span
			>
			<span class="flex items-center gap-1"
				><span class="badge badge-warning badge-xs">↑ schlimmer</span> mehr Betroffene</span
			>
			<span class="flex items-center gap-1"
				><span class="badge badge-success badge-xs">↓ besser</span> weniger Betroffene</span
			>
			<span class="flex items-center gap-1"
				><span class="badge badge-success badge-outline badge-xs">gelöst</span> nicht mehr im Plan</span
			>
			<span>· ohne Markierung = unverändert</span>
		</div>
	{/if}

	{#if resolvedConflicts.length}
		<details open class="collapse-arrow collapse border border-success/40 bg-success/5">
			<summary class="collapse-title text-sm font-medium">
				✅ Im letzten Lauf gelöst
				<span class="badge badge-success badge-sm ml-1 tabular-nums"
					>{resolvedConflicts.length}</span
				>
			</summary>
			<div class="collapse-content">
				<div class="overflow-x-auto rounded-lg border border-base-200">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Nähe</th>
								<th>Prüfung 1</th>
								<th>Prüfung 2</th>
								<th class="text-right">Studis</th>
							</tr>
						</thead>
						<tbody>
							{#each resolvedConflicts as c (pairKey(c.ancode1, c.ancode2))}
								<tr class="line-through opacity-60">
									<td>
										<span class="badge badge-sm {PROX[c.proximity]?.cls ?? 'badge-ghost'}">
											{PROX[c.proximity]?.label ?? c.proximity}
										</span>
									</td>
									<td>
										<div class="font-mono text-xs tabular-nums text-base-content/60">
											{c.ancode1}
										</div>
										<div class="font-medium">{c.module1}</div>
										<div class="text-xs text-base-content/60">{c.mainExamer1}</div>
									</td>
									<td>
										<div class="font-mono text-xs tabular-nums text-base-content/60">
											{c.ancode2}
										</div>
										<div class="font-medium">{c.module2}</div>
										<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
									</td>
									<td class="text-right tabular-nums">{c.studentCount}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</details>
	{/if}

	{#if ratable.length}
		<p class="max-w-3xl text-xs text-base-content/50">
			Nach Schwere sortiert. Studierendenzahl aufklappen, um einen Konflikt <strong
				>pro Studierendem</strong
			>
			zu akzeptieren (z. B. Wiederholer:innen) — das entfernt beim nächsten „Generieren" nur deren Nähe-Strafe.
			„darf zeitgleich" erlaubt Parallelsektionen denselben Slot (die harte Sperre und die Strafe entfallen)
			— das ist nur bei <strong>fehlerhafter Anmeldung</strong>
			sinnvoll, wenn der/die Studierende ohnehin nicht beide Prüfungen schreiben darf.
		</p>
		{#snippet conflictRow(/** @type {any} */ c)}
			{@const key = pairKey(c.ancode1, c.ancode2)}
			{@const diff = diffMeta(c.diffStatus)}
			<tr class="hover {diff?.row ?? ''}">
				<td>
					<span class="badge badge-sm {PROX[c.proximity]?.cls ?? 'badge-ghost'}">
						{PROX[c.proximity]?.label ?? c.proximity}
					</span>
					{#if diff}
						<span class="badge badge-sm {diff.badge} mt-1 block w-fit">{diff.label}</span>
					{/if}
				</td>
				<td>
					{#if fmtSlot(c.slot1)}<div class="font-semibold tabular-nums">
							🕐 {fmtSlot(c.slot1)}
						</div>{/if}
					<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode1}</div>
					<div class="font-medium">{c.module1}</div>
					<div class="text-xs text-base-content/60">{c.mainExamer1}</div>
					{#if c.location1 || c.isRepeaterExam1 || (c.groups1 ?? []).length}
						<div class="mt-0.5 flex flex-wrap items-center gap-1">
							{#if c.location1}<span class="badge badge-accent badge-xs" title="Campus"
									>📍 {c.location1}</span
								>{/if}
							{#if c.isRepeaterExam1}<span
									class="badge badge-outline badge-xs"
									title="Wiederholungsprüfung">🔁 WH</span
								>{/if}
							{#each c.groups1 ?? [] as g}<span class="badge badge-ghost badge-xs">{g}</span>{/each}
						</div>
					{/if}
				</td>
				<td>
					{#if fmtSlot(c.slot2)}<div class="font-semibold tabular-nums">
							🕐 {fmtSlot(c.slot2)}
						</div>{/if}
					<div class="font-mono text-xs tabular-nums text-base-content/60">{c.ancode2}</div>
					<div class="font-medium">{c.module2}</div>
					<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
					{#if c.location2 || c.isRepeaterExam2 || (c.groups2 ?? []).length}
						<div class="mt-0.5 flex flex-wrap items-center gap-1">
							{#if c.location2}<span class="badge badge-accent badge-xs" title="Campus"
									>📍 {c.location2}</span
								>{/if}
							{#if c.isRepeaterExam2}<span
									class="badge badge-outline badge-xs"
									title="Wiederholungsprüfung">🔁 WH</span
								>{/if}
							{#each c.groups2 ?? [] as g}<span class="badge badge-ghost badge-xs">{g}</span>{/each}
						</div>
					{/if}
				</td>
				<td class="text-right tabular-nums">
					<button
						class="btn btn-ghost btn-xs gap-1"
						onclick={() => toggleExpand(key)}
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
								onclick={() => removeShare(c.ancode1, c.ancode2)}
							>
								✕
							</WriteButton>
						</div>
					{:else}
						<WriteButton
							class="btn btn-ghost btn-xs"
							disabled={busy === `s${key}`}
							title="nur bei fehlerhafter Anmeldung sinnvoll — wenn der/die Studierende ohnehin nicht beide Prüfungen schreiben darf"
							onclick={() => allowShare(c.ancode1, c.ancode2)}
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
								Studierenden heraus (zeitgleich bleibt hart verboten; nur „darf zeitgleich" hebt das
								auf). Wiederholer:innen und Paare mit gleichem Slot sind automatisch akzeptiert.
							</span>
							{#each c.affectedStudents ?? [] as s}
								<div
									class="flex flex-wrap items-center gap-2 text-sm {s.accepted ? 'opacity-60' : ''}"
								>
									<span class="w-4 text-center text-success">{s.accepted ? '✓' : ''}</span>
									<span class="font-mono text-xs tabular-nums text-base-content/50">
										{s.mtknr}
									</span>
									<span>{s.name}</span>
									<span
										class="badge badge-ghost badge-xs tabular-nums"
										title="Kohorte des Studierenden">{s.program}{s.group}</span
									>
									{#if s.autoAccepted}
										<span
											class="badge badge-info badge-xs"
											title="automatisch akzeptiert — niemand schreibt beide Prüfungen"
										>
											automatisch akzeptiert ({c.canShareSlot ? 'gleicher Slot' : 'Wiederholung'})
										</span>
										{#if s.decision === 'VETO'}
											<span class="badge badge-warning badge-xs">Veto — nicht akzeptiert</span>
											<WriteButton
												class="btn btn-ghost btn-xs"
												disabled={busy === `a${key}-${s.mtknr}`}
												onclick={() => clearDecision(c, s)}
											>
												Veto zurücknehmen
											</WriteButton>
										{:else}
											<WriteButton
												class="btn btn-ghost btn-xs text-error"
												disabled={busy === `a${key}-${s.mtknr}`}
												title="doch nicht akzeptieren — Nähe-Strafe für diese:n Studierende:n wieder aktivieren"
												onclick={() => decide(c, s, 'VETO')}
											>
												Veto
											</WriteButton>
										{/if}
									{:else if s.decision === 'ACCEPT'}
										<span class="badge badge-success badge-xs">akzeptiert</span>
										<WriteButton
											class="btn btn-ghost btn-xs text-error"
											disabled={busy === `a${key}-${s.mtknr}`}
											onclick={() => clearDecision(c, s)}
										>
											zurücknehmen
										</WriteButton>
									{:else}
										<WriteButton
											class="btn btn-outline btn-xs"
											disabled={busy === `a${key}-${s.mtknr}`}
											onclick={() => decide(c, s, 'ACCEPT')}
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
		{/snippet}

		{#if ratableNonAuto.length}
			<details open class="collapse-arrow collapse border border-base-300 bg-base-100">
				<summary class="collapse-title text-sm font-medium">
					Zu prüfen (nicht automatisch akzeptiert)
					<span class="badge badge-warning badge-sm ml-1 tabular-nums">{ratableNonAuto.length}</span
					>
				</summary>
				<div class="collapse-content">
					<div class="overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead
								><tr
									><th>Nähe</th><th>Prüfung 1</th><th>Prüfung 2</th><th class="text-right">Stud.</th
									><th>gleicher Slot</th></tr
								></thead
							>
							<tbody>
								{#each ratableNonAuto as c (pairKey(c.ancode1, c.ancode2))}
									{@render conflictRow(c)}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</details>
		{/if}
		{#if ratableAuto.length}
			<details class="collapse-arrow collapse border border-base-300 bg-base-100">
				<summary class="collapse-title text-sm font-medium">
					Automatisch akzeptiert (Wiederholung / gleicher Slot)
					<span class="badge badge-ghost badge-sm ml-1 tabular-nums">{ratableAuto.length}</span>
				</summary>
				<div class="collapse-content">
					<div class="overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead
								><tr
									><th>Nähe</th><th>Prüfung 1</th><th>Prüfung 2</th><th class="text-right">Stud.</th
									><th>gleicher Slot</th></tr
								></thead
							>
							<tbody>
								{#each ratableAuto as c (pairKey(c.ancode1, c.ancode2))}
									{@render conflictRow(c)}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</details>
		{/if}
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
										{#if fmtSlot(c.slot1)}<div class="font-semibold tabular-nums">
												🕐 {fmtSlot(c.slot1)}
											</div>{/if}
										<div class="font-mono text-xs tabular-nums text-base-content/60">
											{c.ancode1}
										</div>
										<div class="font-medium">{c.module1}</div>
										<div class="text-xs text-base-content/60">{c.mainExamer1}</div>
										{#if c.location1 || c.isRepeaterExam1 || (c.groups1 ?? []).length}
											<div class="mt-0.5 flex flex-wrap items-center gap-1">
												{#if c.location1}<span class="badge badge-accent badge-xs" title="Campus"
														>📍 {c.location1}</span
													>{/if}
												{#if c.isRepeaterExam1}<span
														class="badge badge-outline badge-xs"
														title="Wiederholungsprüfung">🔁 WH</span
													>{/if}
												{#each c.groups1 ?? [] as g}<span class="badge badge-ghost badge-xs"
														>{g}</span
													>{/each}
											</div>
										{/if}
									</td>
									<td>
										{#if fmtSlot(c.slot2)}<div class="font-semibold tabular-nums">
												🕐 {fmtSlot(c.slot2)}
											</div>{/if}
										<div class="font-mono text-xs tabular-nums text-base-content/60">
											{c.ancode2}
										</div>
										<div class="font-medium">{c.module2}</div>
										<div class="text-xs text-base-content/60">{c.mainExamer2}</div>
										{#if c.location2 || c.isRepeaterExam2 || (c.groups2 ?? []).length}
											<div class="mt-0.5 flex flex-wrap items-center gap-1">
												{#if c.location2}<span class="badge badge-accent badge-xs" title="Campus"
														>📍 {c.location2}</span
													>{/if}
												{#if c.isRepeaterExam2}<span
														class="badge badge-outline badge-xs"
														title="Wiederholungsprüfung">🔁 WH</span
													>{/if}
												{#each c.groups2 ?? [] as g}<span class="badge badge-ghost badge-xs"
														>{g}</span
													>{/each}
											</div>
										{/if}
									</td>
									<td class="text-right tabular-nums">
										<button
											class="btn btn-ghost btn-xs gap-1"
											onclick={() => toggleExpand(key)}
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
														<span class="font-mono text-xs tabular-nums text-base-content/50"
															>{s.mtknr}</span
														>
														{s.name}
														<span
															class="badge badge-ghost badge-xs tabular-nums"
															title="Kohorte des Studierenden">{s.program}{s.group}</span
														>
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
										<span class="font-mono text-xs tabular-nums text-base-content/60"
											>{s.ancode1}</span
										>
										{s.module1}
										<span class="text-xs text-base-content/50">· {s.mainExamer1}</span>
									</td>
									<td>
										<span class="font-mono text-xs tabular-nums text-base-content/60"
											>{s.ancode2}</span
										>
										{s.module2}
										<span class="text-xs text-base-content/50">· {s.mainExamer2}</span>
									</td>
									<td class="text-right">
										<WriteButton
											class="btn btn-primary btn-xs"
											disabled={busy === `s${key}`}
											onclick={() => allowShare(s.ancode1, s.ancode2)}
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
								onclick={() => removeShare(s.ancode1, s.ancode2)}
							>
								entfernen
							</WriteButton>
						</div>
					{/each}
				</div>
			</div>
		</details>
	{/if}

	<!-- alle gespeicherten Per-Studierenden-Entscheidungen -->
	{#if decisions.length}
		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title text-sm font-medium">
				Entscheidungen (pro Studierendem)
				<span class="font-normal text-base-content/50">· {decisions.length}</span>
			</summary>
			<div class="collapse-content">
				<div class="overflow-x-auto rounded-lg border border-base-200">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Prüfung 1</th>
								<th>Prüfung 2</th>
								<th>Studierende:r (Mtknr)</th>
								<th>Entscheidung</th>
							</tr>
						</thead>
						<tbody>
							{#each decisions as a}
								<tr>
									<td class="font-mono tabular-nums">{a.ancode1}</td>
									<td class="font-mono tabular-nums">{a.ancode2}</td>
									<td class="font-mono text-sm tabular-nums text-base-content/60">{a.mtknr}</td>
									<td>
										<span
											class="badge badge-sm {a.decision === 'VETO'
												? 'badge-warning'
												: 'badge-success'}"
										>
											{a.decision === 'VETO' ? 'Veto' : 'akzeptiert'}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</details>
	{/if}
</div>
