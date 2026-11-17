<script>
	import { onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import { getConvert, getWsClient } from '$lib/validation/wsClient';
	import WriteButton from '$lib/WriteButton.svelte';
	import GenerationConfigFields from '$lib/semester/GenerationConfigFields.svelte';
	import { ROOM_GENERATION_FIELDS } from '$lib/semester/generationConfig';

	let { data } = $props();

	// ROOMS gesperrt (Raumplan veröffentlicht) → nur Probelauf erlaubt.
	let roomsBlocked = $derived((data.blockedAreas ?? []).includes('ROOMS'));

	// --- Eingaben ---
	/** @type {number | ''} */
	let seed = $state(1);
	// Iterationen der Raumzuteilung. Ähnlich wie beim Terminplan plateaut die
	// Qualität; der Bereich ist moderat gewählt (schnelle Vorschau bis beste Qualität).
	let iterations = $state(100_000);
	const ITER_MIN = 10_000;
	const ITER_MAX = 1_000_000;
	const ITER_STEP = 10_000;
	// Warm-Start: bestehende Raumzuteilung als Ausgangspunkt behalten (nur verbessern).
	let keepAssigned = $state(false);

	// --- Laufzeit-Status ---
	let running = $state(false);
	let writeRun = $state(false); // letzter/aktueller Lauf schreibt in die DB?
	let seedUsed = $state(1); // Seed des letzten Laufs (Report trägt ihn nicht)
	let keepRun = $state(false); // letzter Lauf war Warm-Start?
	/** @type {string | null} */
	let errorMsg = $state(null);
	let done = $state(false);

	// Terminal: alle Zeilen ausser PROGRESS werden angehaengt; die jeweils letzte
	// PROGRESS-Zeile wird in-place aktualisiert (Spinner-Gefuehl).
	/** @type {{ level: string, html: string }[]} */
	let lines = $state([]);
	/** @type {{ html: string } | null} */
	let current = $state(null);
	/** @type {any} */
	let roomReport = $state(null);

	/** @param {string} level */
	const lineColor = (level) => (level === 'ERROR' ? '#f38ba8' : level === 'WARN' ? '#f9e2af' : '');
	/** @param {string} level */
	const linePrefix = (level) => (level === 'ERROR' ? '✖ ' : level === 'WARN' ? '⚠ ' : '');

	/** @type {HTMLDivElement | undefined} */
	let termEl = $state();

	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

	const SUBSCRIPTION = `
		subscription AssignRooms($dryRun: Boolean!, $seed: Int, $iterations: Int, $keepAssigned: Boolean) {
			assignRoomsForExams(dryRun: $dryRun, seed: $seed, iterations: $iterations, keepAssigned: $keepAssigned) {
				level
				text
				roomReport {
					exams
					placedSeats
					unplacedSeats
					rooms
					hardViolations
					cost
					costByConstraint {
						name
						cost
					}
					iterations
					seed
					stoppedEarly
					written
					unplacedExams {
						ancode
						ntaMtknr
						mtknrs
					}
				}
			}
		}
	`;

	async function scrollToBottom() {
		await tick();
		if (termEl) termEl.scrollTop = termEl.scrollHeight;
	}

	/** @param {boolean} dryRun */
	async function start(dryRun) {
		if (running) return;
		if (!dryRun && roomsBlocked) return;
		lines = [];
		current = null;
		roomReport = null;
		errorMsg = null;
		done = false;
		running = true;
		writeRun = !dryRun;
		keepRun = keepAssigned;
		seedUsed = seed === '' || seed == null ? 1 : Number(seed);

		try {
			if (!convert) convert = await getConvert();
			if (!wsClient) wsClient = await getWsClient();
		} catch (e) {
			errorMsg = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			running = false;
			return;
		}

		unsubscribe = wsClient.subscribe(
			{
				query: SUBSCRIPTION,
				variables: {
					// Seed immer explizit setzen: derselbe Seed erzeugt bei unveränderten
					// Daten dieselbe Raumzuteilung.
					dryRun,
					seed: seedUsed,
					iterations: Number(iterations),
					keepAssigned
				}
			},
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						return;
					}
					const line = msg.data && msg.data.assignRoomsForExams;
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
						if (line.roomReport) roomReport = line.roomReport;
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
					// nach dem Schreiblauf die Raumplan-Daten (Zähler, Warnungen) auffrischen
					if (writeRun) invalidateAll();
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

	// anderen Seed probieren → andere Zuteilung (Probelauf); den neuen Seed ins
	// Feld übernehmen, damit man ihn anschließend so schreiben kann.
	function newSuggestion() {
		seed = (seed === '' || seed == null ? 1 : Number(seed)) + 1;
		start(true);
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	// --- Raumzuteilung zurücksetzen (destruktiv) — Vorplanung (📌) bleibt. ---
	let resetBusy = $state(false);
	let resetInfo = $state('');
	let resetError = $state('');
	async function resetRooms() {
		if (resetBusy || roomsBlocked) return;
		if (
			!confirm(
				'Raumzuteilung zurücksetzen? Vorgeplante (📌) Räume bleiben erhalten. Das lässt sich nicht rückgängig machen.'
			)
		)
			return;
		resetBusy = true;
		resetInfo = '';
		resetError = '';
		try {
			const res = await fetch('/api/room/resetRoomsForExams', { method: 'POST' });
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				resetError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			resetInfo = 'Raumzuteilung zurückgesetzt (vorgeplante Räume bleiben).';
			roomReport = null;
			await invalidateAll();
		} catch (e) {
			resetError = e instanceof Error ? e.message : String(e);
		} finally {
			resetBusy = false;
		}
	}

	/** @param {number} n */
	const fmt = (n) => (n ?? 0).toLocaleString('de-DE');
	/** @param {any} v */
	const asArray = (v) => (Array.isArray(v) ? v : []);

	const KIND_BADGE = /** @type {Record<string, string>} */ ({
		hard: 'badge-error',
		soft: 'badge-info'
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Räume generieren</h1>
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
			{#if keepAssigned}
				<span class="badge badge-ghost">Warm-Start</span>
			{/if}
		{/if}
	</div>

	<p class="max-w-3xl text-sm text-base-content/60">
		Ordnet allen verplanten Prüfungen automatisch Räume zu. Die je Slot erlaubten Räume werden live
		aus den aktuellen Räumen/Anforderungen/Buchungen berechnet. EXaHM-Raum-Slots kommen
		ausschließlich aus dem Anny-Import — ohne Import keine EXaHM-Belegung.
	</p>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Daten konnten nicht geladen werden (Backend-Fehler).</span>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	{#if roomsBlocked}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				🔒 Raumplan gesperrt — der Raumplan ist veröffentlicht. „Generieren &amp; schreiben" ist
				deaktiviert; der Probelauf bleibt möglich. Für Korrekturen das Häkchen „Raumplan
				veröffentlicht" auf der Startseite kurz lösen.
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
				Standard 100k; mehr Iterationen = etwas bessere Qualität, aber länger.
			</span>
		</div>
		<label class="flex max-w-xs flex-col gap-1">
			<span class="flex cursor-pointer items-center gap-2 text-xs font-medium text-base-content/60">
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={keepAssigned}
					disabled={running}
				/>
				bestehende Zuteilung verbessern (Warm-Start)
			</span>
			<span class="text-xs text-base-content/50">
				Behält die aktuelle Raumzuteilung als Ausgangspunkt und ändert nur, was sie verbessert —
				sinnvoll nach kleinen Anpassungen/Sperren. Für eine komplett neue Zuteilung aus lassen.
			</span>
		</label>
	</div>

	<!-- Aktionen -->
	<div class="flex flex-wrap items-center gap-3">
		{#if running}
			<button class="btn btn-error btn-sm gap-2" onclick={stop}>
				<span class="loading loading-spinner loading-xs"></span> Abbrechen
			</button>
		{:else}
			<button class="btn btn-outline btn-sm" onclick={() => start(true)}>▷ Probelauf</button>
			<button
				class="btn btn-primary btn-sm"
				disabled={roomsBlocked}
				onclick={() => start(false)}
				title={roomsBlocked
					? 'gesperrt — siehe Hinweis oben'
					: 'schreibt die Raumzuteilung mit dem aktuellen Seed — identisch zum Probelauf mit demselben Seed'}
			>
				▶ Generieren &amp; schreiben
			</button>
			<button
				class="btn btn-ghost btn-sm"
				onclick={newSuggestion}
				title="anderen Seed (aktueller + 1) als Probelauf → andere Zuteilung"
			>
				🎲 Neuer Vorschlag
			</button>
		{/if}
		<span class="text-xs text-base-content/50">
			Probelauf schreibt nichts. Derselbe Seed erzeugt bei unveränderten Daten dieselbe Zuteilung —
			nach einem guten Probelauf einfach mit demselben Seed „schreiben".
		</span>
	</div>

	<!-- Zurücksetzen (destruktiv) -->
	<div class="flex flex-col gap-1 border-t border-base-300 pt-2">
		<div class="flex flex-wrap items-center gap-3">
			<WriteButton
				class="btn btn-outline btn-error btn-sm"
				disabled={roomsBlocked || resetBusy}
				title={roomsBlocked ? 'Raumplan veröffentlicht — Zurücksetzen gesperrt' : ''}
				onclick={resetRooms}
			>
				{resetBusy ? 'Setzt zurück…' : 'Raumzuteilung zurücksetzen'}
			</WriteButton>
			<span class="text-xs text-base-content/50">
				Entfernt die Raumzuteilung; vorgeplante (📌) Räume bleiben erhalten.
			</span>
		</div>
		{#if resetInfo}
			<div class="alert alert-success py-2 text-sm"><span>{resetInfo}</span></div>
		{/if}
		{#if resetError}
			<div class="alert alert-error py-2 text-sm"><span>{resetError}</span></div>
		{/if}
	</div>

	{#if errorMsg}
		<div class="alert alert-error" transition:fade>
			<span class="whitespace-pre-wrap break-words">{errorMsg}</span>
		</div>
	{/if}

	<!-- Terminal -->
	<div
		bind:this={termEl}
		class="h-96 overflow-auto rounded-lg border border-base-300 p-3 font-mono text-xs leading-relaxed"
		style="background:#1e1e2e; color:#d4d4d4"
	>
		{#if !lines.length && !current && !running}
			<div style="color:#6c7086">
				Bereit. Parameter wählen und „Probelauf" oder „Generieren" starten.
			</div>
		{/if}
		{#each lines as line}
			<div
				class="whitespace-pre-wrap break-words {line.level === 'WARN' || line.level === 'ERROR'
					? 'font-semibold'
					: ''}"
				style={lineColor(line.level) ? `color:${lineColor(line.level)}` : ''}
			>
				{linePrefix(line.level)}{@html line.html}
			</div>
		{/each}
		{#if current}
			<div class="flex items-start gap-2 whitespace-pre-wrap break-words" style="color:#f9e2af">
				<span class="loading loading-spinner loading-xs mt-0.5"></span>
				<span>{@html current.html}</span>
			</div>
		{/if}
	</div>

	<!-- Ergebnis-Report -->
	{#if roomReport}
		{@const r = roomReport}
		{@const hv = asArray(r.hardViolations)}
		{@const unplaced = asArray(r.unplacedExams)}
		<div class="flex flex-col gap-4" transition:fade>
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-xl font-semibold">Ergebnis-Report</h2>
				<span class="badge badge-outline gap-1 tabular-nums" title="verwendeter Seed">
					Seed {r.seed ?? seedUsed}
				</span>
				{#if r.written}
					<span class="badge badge-success">in DB geschrieben</span>
				{:else}
					<span class="badge badge-ghost">Probelauf — nichts gespeichert</span>
				{/if}
				{#if r.stoppedEarly}<span class="badge badge-ghost">früh gestoppt</span>{/if}
				{#if keepRun}<span class="badge badge-ghost">Warm-Start</span>{/if}
			</div>

			<!-- Kennzahlen -->
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
				{#each [{ label: 'Prüfungen', value: fmt(r.exams) }, { label: 'platzierte Plätze', value: fmt(r.placedSeats) }, { label: 'ungeplante Plätze', value: fmt(r.unplacedSeats) }, { label: 'Räume', value: fmt(r.rooms) }, { label: 'Kosten', value: fmt(r.cost) }, { label: 'Iterationen', value: fmt(r.iterations) }] as stat}
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs leading-tight text-base-content/60">{stat.label}</div>
						<div class="text-lg font-semibold tabular-nums">{stat.value}</div>
					</div>
				{/each}
			</div>

			<!-- harte Verletzungen (sollten 0 sein) -->
			{#if hv.length}
				<div class="alert alert-error flex-col items-start py-2 text-sm">
					<span
						><strong>{fmt(hv.length)}</strong> harte Verletzung(en) — der Plan ist nicht gültig.</span
					>
					<ul class="ml-4 list-disc font-mono text-xs opacity-80">
						{#each hv as v}
							<li>{v}</li>
						{/each}
					</ul>
				</div>
			{:else}
				<div class="alert alert-success py-2 text-sm">
					<span>Keine harten Verletzungen.</span>
				</div>
			{/if}

			<!-- ungeplante Prüfungen (mit betroffenen Studierenden) -->
			{#if unplaced.length}
				<div class="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
					<span class="text-sm font-medium">Ungeplante Prüfungen ({unplaced.length})</span>
					<div class="flex flex-wrap gap-1">
						{#each unplaced as u}
							<span
								class="badge badge-warning badge-sm gap-1 tabular-nums"
								title={`${asArray(u.mtknrs).length} Studierende ohne Raum`}
							>
								{#if u.ntaMtknr}<span class="font-semibold">NTA</span>{/if}
								{u.ancode}
								<span class="opacity-70">· {asArray(u.mtknrs).length}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Kosten je Constraint -->
			{#if asArray(r.costByConstraint).length}
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

	<!-- Raumplanungs-Parameter (Teil der globalen generationConfig) -->
	<details class="collapse-arrow collapse border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			⚙️ Raumplanungs-Parameter
			<span class="font-normal text-base-content/50"
				>· global · wirken beim nächsten „Generieren"</span
			>
		</summary>
		<div class="collapse-content flex flex-col gap-3">
			<div class="max-w-3xl text-xs text-base-content/50">
				Steuerung der automatischen Raumzuteilung. Alle Werte sind mit sinnvollen Defaults vorbelegt
				— nur bei Bedarf ändern. <strong>„ungeplante Prüfung"</strong> ist dominant und sollte hoch
				bleiben. Der <strong>Hitze-Modus</strong> vermeidet im Sommer heiße Räume in oberen Stockwerken.
			</div>
			<GenerationConfigFields
				config={data.generationConfig}
				sections={[{ fields: ROOM_GENERATION_FIELDS }]}
			/>
		</div>
	</details>

	<!-- Angewandte Constraints (read-only) -->
	<details class="collapse-arrow collapse border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			Angewandte Constraints
			<span class="font-normal text-base-content/50"
				>· {(data.constraints ?? []).length} · read-only</span
			>
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
