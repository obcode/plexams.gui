<script>
	import { onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { env } from '$env/dynamic/public';
	import { invalidateAll } from '$app/navigation';
	import ExamConflictsPanel from '$lib/exam/ExamConflictsPanel.svelte';

	export let data;

	// Konflikt-Diff: vor einem Schreiblauf die Konfliktliste festhalten, danach
	// vergleichen (weg / geblieben / neu).
	/** @type {any[] | null} */
	let conflictSnapshot = null;
	/** @type {{ removed: any[], stayed: any[], added: any[] } | null} */
	let conflictDiff = null;

	/** @param {any} c */
	const cKey = (c) => [c.ancode1, c.ancode2].sort((a, b) => a - b).join('-');
	/** @param {any[]} before @param {any[]} after */
	function computeDiff(before, after) {
		const beforeKeys = new Set(before.map(cKey));
		const afterKeys = new Set(after.map(cKey));
		return {
			removed: before.filter((c) => !afterKeys.has(cKey(c))),
			stayed: after.filter((c) => beforeKeys.has(cKey(c))),
			added: after.filter((c) => !beforeKeys.has(cKey(c)))
		};
	}
	async function refreshConflictsAndDiff() {
		const before = conflictSnapshot ?? [];
		await invalidateAll();
		await tick();
		conflictDiff = computeDiff(before, data.conflicts ?? []);
	}

	// EXAMS gesperrt (draftSent/examPlanPublished gesetzt) → nur Probelauf erlaubt.
	$: examsBlocked = (data.blockedAreas ?? []).includes('EXAMS');

	// --- Eingaben ---
	/** @type {number | ''} */
	let seed = 1;
	// Terminplan: Qualität plateaut bei ~1 Mio.; darüber bringt es nichts (die auf
	// die Iterationszahl normierte Abkühlung kann sogar leicht schlechter werden).
	// Daher enger Bereich 100k–2M statt 1–20 Mio. wie bei den Aufsichten.
	let iterations = 1_000_000;
	const ITER_MIN = 100_000;
	const ITER_MAX = 2_000_000;
	const ITER_STEP = 100_000;

	// --- Laufzeit-Status ---
	let running = false;
	let writeRun = false; // letzter/aktueller Lauf schreibt in die DB?
	/** @type {string | null} */
	let errorMsg = null;
	let done = false;

	// Terminal: alle Zeilen ausser PROGRESS werden angehaengt; die jeweils letzte
	// PROGRESS-Zeile wird in-place aktualisiert (Spinner-Gefuehl). Fortschritt
	// kommt beim Terminplan als Text (kein strukturiertes progress-Objekt).
	/** @type {{ level: string, html: string }[]} */
	let lines = [];
	/** @type {{ html: string } | null} */
	let current = null;
	/** @type {any} */
	let examReport = null;

	/** @type {HTMLDivElement} */
	let termEl;

	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

	const SUBSCRIPTION = `
		subscription Generate($dryRun: Boolean!, $seed: Int, $iterations: Int) {
			generateExamSchedule(dryRun: $dryRun, seed: $seed, iterations: $iterations) {
				level
				text
				examReport {
					units
					fixed
					placed
					unplaced
					unplacedAncodes
					hardViolations
					cost
					costByConstraint {
						name
						cost
					}
					iterations
					stoppedEarly
					written
					diagnostics {
						students
						pairs
						sameSlot
						adjacent
						sameDay
						nextDay
						within3
						further
						studentsWithAdjacent
						studentsWithSameDay
						worstStudentPenalty
						maxSlotSeats
						slotsUsed
						slotsOverThreshold
						maxExamsPerSlot
					}
				}
			}
		}
	`;

	function wsUrl() {
		const http = env.PUBLIC_PLEXAMS_SERVER || 'http://localhost:8080/query';
		return http.replace(/^http/, 'ws');
	}

	async function scrollToBottom() {
		await tick();
		if (termEl) termEl.scrollTop = termEl.scrollHeight;
	}

	/** @param {boolean} dryRun */
	async function start(dryRun) {
		if (running) return;
		if (!dryRun && examsBlocked) return;
		lines = [];
		current = null;
		examReport = null;
		errorMsg = null;
		done = false;
		running = true;
		writeRun = !dryRun;
		conflictDiff = null;
		// nur beim Schreiblauf ändert sich der Plan → Snapshot für den Diff
		conflictSnapshot = writeRun ? [...(data.conflicts ?? [])] : null;

		try {
			if (!convert) {
				const Convert = (await import('ansi-to-html')).default;
				convert = new Convert({
					fg: '#d4d4d4',
					bg: '#1e1e2e',
					newline: false,
					escapeXML: true,
					colors: {
						0: '#1e1e2e',
						1: '#f38ba8',
						2: '#a6e3a1',
						3: '#f9e2af',
						4: '#89b4fa',
						5: '#cba6f7',
						6: '#94e2d5',
						7: '#bac2de'
					}
				});
			}
			if (!wsClient) {
				const { createClient } = await import('graphql-ws');
				wsClient = createClient({ url: wsUrl(), lazy: true, retryAttempts: 0 });
			}
		} catch (e) {
			errorMsg = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			running = false;
			return;
		}

		unsubscribe = wsClient.subscribe(
			{
				query: SUBSCRIPTION,
				variables: {
					dryRun,
					seed: seed === '' ? null : Number(seed),
					iterations: Number(iterations)
				}
			},
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						return;
					}
					const line = msg.data && msg.data.generateExamSchedule;
					if (!line) return;
					const html = convert.toHtml(line.text ?? '');
					if (line.level === 'PROGRESS') {
						current = { html };
					} else {
						if (current) {
							lines = [...lines, { level: 'PROGRESS', html: current.html }];
							current = null;
						}
						lines = [...lines, { level: line.level, html }];
						if (line.examReport) examReport = line.examReport;
						if (line.level === 'DONE') done = true;
					}
					scrollToBottom();
				},
				/** @param {any} err */
				error: (err) => {
					errorMsg =
						err instanceof Error
							? err.message
							: Array.isArray(err)
								? err.map((/** @type {any} */ e) => e.message).join('; ')
								: err && err.reason
									? err.reason
									: 'Verbindungsfehler';
					running = false;
				},
				complete: () => {
					if (current) {
						lines = [...lines, { level: 'PROGRESS', html: current.html }];
						current = null;
					}
					running = false;
					done = true;
					// nach dem Schreiblauf Konflikte neu laden und Diff berechnen
					if (writeRun) refreshConflictsAndDiff();
				}
			}
		);
	}

	function stop() {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
		running = false;
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (wsClient) wsClient.dispose();
	});

	/** @param {number} n */
	const fmt = (n) => (n ?? 0).toLocaleString('de-DE');

	const KIND_BADGE = /** @type {Record<string, string>} */ ({
		hard: 'badge-error',
		soft: 'badge-info'
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Terminplan generieren</h1>
		{#if running}
			<span class="badge badge-info gap-2">
				<span class="loading loading-spinner loading-xs"></span> läuft …
			</span>
		{:else if done && !errorMsg}
			<span class="badge badge-success">fertig</span>
		{/if}
		{#if running}
			{#if writeRun}
				<span class="badge badge-warning">schreibt in die Datenbank</span>
			{:else}
				<span class="badge badge-ghost">Probelauf (kein Schreiben)</span>
			{/if}
		{/if}
	</div>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Daten konnten nicht geladen werden (Backend-Fehler).</span>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	{#if examsBlocked}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				🔒 Terminplan gesperrt — Entwurf verschickt oder Prüfungsplan veröffentlicht. „Generieren
				&amp; schreiben" ist deaktiviert; der Probelauf bleibt möglich. Zum Neuschreiben zuerst das
				jeweilige Häkchen auf der Startseite lösen.
			</span>
		</div>
	{/if}

	<!-- Eingaben -->
	<div class="flex flex-wrap items-end gap-6 rounded-lg border border-base-300 bg-base-100 p-4">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Seed</span>
			<input
				type="number"
				class="input input-bordered input-sm w-24"
				bind:value={seed}
				min="0"
				disabled={running}
			/>
		</label>
		<div class="flex flex-col gap-1">
			<div class="flex items-baseline justify-between gap-3">
				<span class="text-xs font-medium text-base-content/60">Iterationen</span>
				<span class="text-sm font-semibold tabular-nums">{fmt(iterations)}</span>
			</div>
			<input
				type="range"
				class="range range-primary range-sm w-72"
				min={ITER_MIN}
				max={ITER_MAX}
				step={ITER_STEP}
				bind:value={iterations}
				disabled={running}
			/>
			<div class="flex justify-between text-[10px] text-base-content/50">
				<span>{fmt(ITER_MIN)}</span>
				<span>{fmt(ITER_MAX)}</span>
			</div>
			<span class="text-xs text-base-content/50">
				Standard 1 Mio.; mehr bringt i. d. R. nichts. 100k ≈ 0,3 s (schnelle Vorschau), 1 Mio. ≈ 3 s
				(beste Qualität).
			</span>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		{#if running}
			<button class="btn btn-error btn-sm gap-2" on:click={stop}>
				<span class="loading loading-spinner loading-xs"></span> Abbrechen
			</button>
		{:else}
			<button class="btn btn-outline btn-sm" on:click={() => start(true)}>▷ Probelauf</button>
			<button
				class="btn btn-primary btn-sm"
				disabled={examsBlocked}
				on:click={() => start(false)}
				title={examsBlocked ? 'gesperrt — siehe Hinweis oben' : ''}
			>
				▶ Generieren &amp; schreiben
			</button>
		{/if}
		<span class="text-xs text-base-content/50">
			Probelauf rechnet und liefert einen Report, schreibt aber nichts in die Datenbank.
		</span>
	</div>

	{#if errorMsg}
		<div class="alert alert-error" transition:fade>
			<span>{errorMsg}</span>
		</div>
	{/if}

	<!-- Terminal -->
	<div
		bind:this={termEl}
		class="h-96 overflow-auto rounded-lg border border-base-300 p-3 font-mono text-xs leading-relaxed"
		style="background:#1e1e2e; color:#d4d4d4"
	>
		{#if !lines.length && !current && !running}
			<div style="color:#6c7086">Bereit. Parameter wählen und „Probelauf" oder „Generieren" starten.</div>
		{/if}
		{#each lines as line}
			<div class="whitespace-pre-wrap break-words">{@html line.html}</div>
		{/each}
		{#if current}
			<div class="flex items-start gap-2 whitespace-pre-wrap break-words" style="color:#f9e2af">
				<span class="loading loading-spinner loading-xs mt-0.5"></span>
				<span>{@html current.html}</span>
			</div>
		{/if}
	</div>

	<!-- Ergebnis-Report -->
	{#if examReport}
		{@const r = examReport}
		{@const d = r.diagnostics ?? {}}
		<div class="flex flex-col gap-4" transition:fade>
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-xl font-semibold">Ergebnis-Report</h2>
				{#if r.written}
					<span class="badge badge-success">in DB geschrieben</span>
				{:else}
					<span class="badge badge-ghost">Probelauf — nichts gespeichert</span>
				{/if}
				{#if r.stoppedEarly}<span class="badge badge-ghost">früh gestoppt</span>{/if}
			</div>

			<!-- Kennzahlen -->
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
				{#each [{ label: 'Prüfungen', value: fmt(r.units) }, { label: 'platziert', value: fmt(r.placed) }, { label: 'fest', value: fmt(r.fixed) }, { label: 'ungeplant', value: fmt(r.unplaced) }, { label: 'Kosten', value: fmt(r.cost) }, { label: 'Iterationen', value: fmt(r.iterations) }] as stat}
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs leading-tight text-base-content/60">{stat.label}</div>
						<div class="text-lg font-semibold tabular-nums">{stat.value}</div>
					</div>
				{/each}
			</div>

			<!-- harte Verletzungen (sollten 0 sein) -->
			{#if r.hardViolations > 0}
				<div class="alert alert-error py-2 text-sm">
					<span><strong>{fmt(r.hardViolations)}</strong> harte Verletzung(en) — der Plan ist nicht gültig.</span>
				</div>
			{:else}
				<div class="alert alert-success py-2 text-sm">
					<span>Keine harten Verletzungen.</span>
				</div>
			{/if}

			<!-- ungeplante Prüfungen -->
			{#if (r.unplacedAncodes ?? []).length}
				<div class="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/10 p-3">
					<span class="text-sm font-medium">Ungeplante Prüfungen ({r.unplacedAncodes.length})</span>
					<div class="flex flex-wrap gap-1">
						{#each r.unplacedAncodes as a}
							<span class="badge badge-warning badge-sm tabular-nums">{a}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Qualität (Diagnostics) -->
			<div class="flex flex-col gap-2">
				<h3 class="font-semibold">Qualität für Studierende</h3>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs text-base-content/60">direkt nacheinander (adjacent)</div>
						<div class="text-lg font-semibold tabular-nums">{fmt(d.adjacent)}</div>
						<div class="text-xs text-base-content/50">{fmt(d.studentsWithAdjacent)} Studierende betroffen</div>
					</div>
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs text-base-content/60">selber Tag (sameDay)</div>
						<div class="text-lg font-semibold tabular-nums">{fmt(d.sameDay)}</div>
						<div class="text-xs text-base-content/50">{fmt(d.studentsWithSameDay)} Studierende betroffen</div>
					</div>
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs text-base-content/60">Folgetag (nextDay)</div>
						<div class="text-lg font-semibold tabular-nums">{fmt(d.nextDay)}</div>
					</div>
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs text-base-content/60">schlechteste:r Studierende:r</div>
						<div class="text-lg font-semibold tabular-nums">{fmt(d.worstStudentPenalty)}</div>
						<div class="text-xs text-base-content/50">Strafpunkte</div>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 xl:grid-cols-6">
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">Studierende</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.students)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">Paare</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.pairs)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">selber Slot</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.sameSlot)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">in 3 Tagen</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.within3)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">weiter</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.further)}</span>
					</div>
				</div>

				<h3 class="mt-2 font-semibold">Slot-Auslastung</h3>
				<div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">Slots genutzt</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.slotsUsed)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">max. Sitze/Slot</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.maxSlotSeats)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">max. Prüfungen/Slot</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.maxExamsPerSlot)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">Slots über Schwelle</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.slotsOverThreshold)}</span>
					</div>
				</div>
			</div>

			<!-- Kosten je Constraint -->
			{#if (r.costByConstraint ?? []).length}
				<details class="collapse-arrow collapse border border-base-300 bg-base-100">
					<summary class="collapse-title text-sm font-medium">Kosten je Constraint</summary>
					<div class="collapse-content">
						<div class="overflow-x-auto rounded-lg border border-base-200">
							<table class="table table-sm">
								<thead><tr><th>Constraint</th><th class="text-right">Kosten</th></tr></thead>
								<tbody>
									{#each r.costByConstraint as cc}
										<tr>
											<td>{cc.name}</td>
											<td class="text-right tabular-nums">{fmt(cc.cost)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</details>
			{/if}
		</div>
	{/if}

	<!-- Diff der Konflikte gegenüber vor dem letzten Schreiblauf -->
	{#if conflictDiff}
		<div class="alert flex-wrap gap-3 py-2 text-sm" transition:fade>
			<span class="font-medium">Änderung durch den letzten Lauf:</span>
			<span class="text-success">− {conflictDiff.removed.length} weg</span>
			<span class="text-base-content/60">= {conflictDiff.stayed.length} geblieben</span>
			<span class="text-warning">＋ {conflictDiff.added.length} neu</span>
		</div>
	{/if}

	<!-- Konflikt-Bewertungs-Loop -->
	<ExamConflictsPanel
		conflicts={data.conflicts}
		ratings={data.ratings}
		suggestions={data.suggestions}
		shareList={data.shareList}
		loadError={data.conflictsError}
	/>

	<!-- Angewandte Constraints (read-only) -->
	<details class="collapse-arrow collapse border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			Angewandte Constraints
			<span class="font-normal text-base-content/50">· {(data.constraints ?? []).length} · read-only</span>
		</summary>
		<div class="collapse-content">
			<div class="overflow-x-auto rounded-lg border border-base-200">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Tier</th>
							<th>Art</th>
							<th>Titel</th>
							<th>Beschreibung</th>
							<th class="text-right">Gewicht</th>
						</tr>
					</thead>
					<tbody>
						{#each data.constraints ?? [] as c}
							<tr>
								<td class="tabular-nums">{c.tier}</td>
								<td>
									<span class="badge badge-sm {KIND_BADGE[c.kind] ?? 'badge-ghost'}">{c.kind}</span>
								</td>
								<td class="font-medium">{c.title}</td>
								<td class="text-sm text-base-content/70">{c.description}</td>
								<td class="text-right tabular-nums">{c.kind === 'hard' ? '—' : fmt(c.weight)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</details>
</div>
