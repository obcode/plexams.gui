<script>
	import { onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { env } from '$env/dynamic/public';
	import WriteButton from '$lib/WriteButton.svelte';
	import { toGenerationConfigInput } from '$lib/semester/generationConfig';

	let { data } = $props();

	// --- Eingaben ---
	let dryRun = $state(true);
	let seed = $state(1);
	let iterations = $state(2_000_000);

	const ITER_MIN = 1_000_000;
	const ITER_MAX = 20_000_000;
	const ITER_STEP = 1_000_000;

	// --- Laufzeit-Status ---
	let running = $state(false);
	/** @type {string | null} */
	let errorMsg = $state(null);
	let done = $state(false);

	// Terminal: alle Zeilen ausser PROGRESS werden angehaengt; die jeweils
	// letzte PROGRESS-Zeile wird in-place aktualisiert (Spinner-Gefuehl).
	/** @type {{ level: string, html: string }[]} */
	let lines = $state([]);
	let current = $state(/** @type {{ html: string, progress: any } | null} */ (null));
	/** @type {any} */
	let report = $state(null);

	let termEl = $state(/** @type {HTMLDivElement | undefined} */ (undefined));

	// ANSI->HTML Konverter und WS-Client werden nur im Browser geladen.
	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

	const SUBSCRIPTION = `
		subscription Generate($dryRun: Boolean!, $seed: Int, $iterations: Int) {
			assignInvigilations(dryRun: $dryRun, seed: $seed, iterations: $iterations) {
				level
				text
				progress { iteration total bestCost balance unfilled }
				report {
					seed iterations iterationsRun stoppedEarly
					balance { satisfied invigilators toleranceMin withinTolerance over under maxOver maxUnder }
					coverage { positions unfilled }
					minutes { withinTolerance over under toleranceMin }
					outliers { invigilatorID doing target open percent }
					fairness { kind total max buckets { count invigilators } }
					softCost { total breakdown { name cost } }
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

	async function start() {
		if (running) return;
		// Status zuruecksetzen
		lines = [];
		current = null;
		report = null;
		errorMsg = null;
		done = false;
		running = true;

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
				variables: { dryRun, seed, iterations }
			},
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						return;
					}
					const line = msg.data && msg.data.assignInvigilations;
					if (!line) return;
					const html = convert.toHtml(line.text ?? '');
					if (line.level === 'PROGRESS') {
						current = { html, progress: line.progress };
					} else {
						// laufende PROGRESS-Zeile als feste Zeile uebernehmen
						if (current) {
							lines = [...lines, { level: 'PROGRESS', html: current.html }];
							current = null;
						}
						lines = [...lines, { level: line.level, html }];
						if (line.report) report = line.report;
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

	let progressPct = $derived(
		current && current.progress && current.progress.total
			? Math.min(100, Math.round((current.progress.iteration / current.progress.total) * 100))
			: 0
	);

	// --- Globale Optimierer-Parameter (generationConfig) ---
	// Die drei Solver teilen sich eine Config; hier als eigene Abschnitte editiert.
	/** @typedef {{ key: string, label: string, int?: boolean, caution?: boolean, hint?: string }} CfgField */

	// Aufsichten (invigplan) — unverändert.
	/** @type {CfgField[]} */
	const NUM_FIELDS = [
		{ key: 'iterations', label: 'Iterationen', int: true },
		{ key: 'startTemp', label: 'Start-Temperatur' },
		{ key: 'endTemp', label: 'End-Temperatur' },
		{ key: 'toleranceMin', label: 'Toleranz (min)', int: true },
		{ key: 'maxSpanHours', label: 'max. Spanne (h)' }
	];
	/** @type {CfgField[]} */
	const WEIGHTS = [
		{ key: 'weightMinuteBalance', label: 'Minuten-Balance' },
		{ key: 'weightBeyondTolerance', label: 'über Toleranz' },
		{ key: 'weightOverTargetFactor', label: 'über Soll (Faktor)' },
		{ key: 'weightCoverage', label: 'Abdeckung' },
		{ key: 'weightMaxDays', label: 'max. Tage' },
		{ key: 'weightPreferExamDays', label: 'Prüfungstage bevorzugen' },
		{ key: 'weightDistribution', label: 'Verteilung' },
		{ key: 'weightDaySpan', label: 'Tages-Spanne' }
	];

	// Terminplan (examplan) — Solver-Gewichte (wirken beim „Terminplan generieren").
	/** @type {CfgField[]} */
	const EXAM_WEIGHTS = [
		{
			key: 'examAdjacent',
			label: 'direkt hintereinander',
			hint: 'zwei Prüfungen direkt hintereinander am selben Tag (sehr schlecht)'
		},
		{ key: 'examSameDay', label: 'selber Tag', hint: 'selber Tag, nicht direkt hintereinander' },
		{
			key: 'examDayFactor',
			label: 'Tagesabstand-Faktor',
			hint: 'über Tage: fällt mit dem echten Stundenabstand'
		},
		{
			key: 'examWorstCase',
			label: 'Worst-Case-Schutz',
			hint: 'schützt den am schlechtesten verteilten Studierenden'
		},
		{
			key: 'examRepeatFactor',
			label: 'Wiederholungs-Faktor',
			hint: 'Abwertung für (wahrscheinliche) Wiederholungs-Konflikte (0..1)'
		},
		{
			key: 'examAttract',
			label: 'Zusammenziehen',
			hint: 'zieht Parallelgruppen/kleine Prüfungen desselben Prüfers zusammen'
		},
		{
			key: 'examSlotLoad',
			label: 'Startzeit-Auslastung',
			hint: 'Gleichverteilung über Startzeiten'
		},
		{
			key: 'examLoadThreshold',
			label: 'Auslastungs-Schwelle',
			int: true,
			hint: 'Schwelle für die Gleichverteilung über Startzeiten'
		},
		{
			key: 'examUnplaced',
			label: 'ungeplante Prüfung',
			caution: true,
			hint: 'Strafe pro ungeplanter Prüfung — dominant, hoch lassen'
		},
		{
			key: 'examCrossCampus',
			label: 'Standortwechsel',
			hint: 'selber Tag über verschiedene Standorte (Reisezeit)'
		},
		{
			key: 'examTbauFill',
			label: 'T-Bau-Sitze',
			hint: 'pro ungenutztem gebuchten T-Bau-Sitz (nur EXaHM/SEB-Raumphase A)'
		},
		{
			key: 'examHole',
			label: 'Startzeit-Lücke',
			hint: 'leere Startzeit zwischen belegten am selben Tag (schlecht für Aufsichten)'
		},
		{
			key: 'examClosenessFalloffMin',
			label: 'Zeit-Falloff (min)',
			hint: '0 = raster-äquivalent; >0 = kontinuierlicher Zeit-Falloff (Zeitkonstante in Minuten) für feinere Startzeiten'
		}
	];

	// Pre-Plan.
	/** @type {CfgField[]} */
	const PREPLAN = [
		{
			key: 'preplanCapacityFactor',
			label: 'Kapazitäts-Faktor',
			hint: 'nutzbarer Anteil der gebuchten Anny-Sitze (1.0 = voll füllen)'
		}
	];

	const ALL_PARAMS = [...NUM_FIELDS, ...WEIGHTS, ...EXAM_WEIGHTS, ...PREPLAN];

	/** @type {Record<string, any>} */
	let cfgForm = $state({});
	for (const f of ALL_PARAMS) cfgForm[f.key] = data.config?.[f.key] ?? 0;

	let cfgSaving = $state(false);
	let cfgError = $state('');
	let cfgSavedAt = $state('');

	async function saveConfig() {
		if (cfgSaving) return;
		cfgSaving = true;
		cfgError = '';
		cfgSavedAt = '';
		// Nur die im Formular editierten Felder überschreiben; die Tageszeiten-Felder
		// (auf der Terminplan-Seite editiert) verbatim aus der geladenen Config
		// durchreichen — der Input ist komplett non-null.
		/** @type {Record<string, any>} */
		const overrides = {};
		for (const f of ALL_PARAMS) overrides[f.key] = cfgForm[f.key];
		const input = toGenerationConfigInput(data.config, overrides);
		try {
			const res = await fetch('/api/semester/setGenerationConfig', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				cfgError = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			cfgSavedAt = new Date().toLocaleTimeString('de-DE');
		} catch (e) {
			cfgError = e instanceof Error ? e.message : String(e);
		} finally {
			cfgSaving = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Aufsichten einteilen</h1>
		{#if running}
			<span class="badge badge-info gap-2">
				<span class="loading loading-spinner loading-xs"></span> läuft …
			</span>
		{:else if done && !errorMsg}
			<span class="badge badge-success">fertig</span>
		{/if}
		{#if dryRun}
			<span class="badge badge-ghost">Probelauf (kein Schreiben in die DB)</span>
		{:else}
			<span class="badge badge-warning">schreibt in die Datenbank</span>
		{/if}
	</div>

	<!-- Eingaben -->
	<div class="flex flex-wrap items-start gap-6 rounded-lg border border-base-300 bg-base-100 p-4">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Probelauf (Dry Run)</span>
			<label class="label cursor-pointer justify-start gap-3 px-0">
				<input
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={dryRun}
					disabled={running}
				/>
				<span class="label-text">{dryRun ? 'nur berechnen' : 'speichern'}</span>
			</label>
		</label>

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
				class="range range-primary range-sm w-64"
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
		</div>
	</div>

	<!-- Globale Optimierer-Parameter (selten geändert, daher eingeklappt) -->
	<details class="collapse collapse-arrow border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			⚙️ Erweiterte Parameter
			<span class="font-normal text-base-content/50"
				>· global · alle drei Solver (Terminplan, Pre-Plan, Aufsichten)</span
			>
		</summary>
		<div class="collapse-content flex flex-col gap-4">
			{#if cfgError}
				<div class="alert alert-error py-2 text-sm"><span>{cfgError}</span></div>
			{/if}
			{#if cfgSavedAt}
				<div class="alert alert-success py-2 text-sm">
					<span>Parameter gespeichert ({cfgSavedAt}).</span>
				</div>
			{/if}

			<div class="text-xs text-base-content/50">
				Diese Werte gelten global für alle Läufe und kommen mit sinnvollen Defaults vorbelegt.
				„Iterationen" oben (Schieberegler) ist der Wert für diesen Aufsichten-Lauf.
			</div>

			{#snippet fieldGrid(/** @type {CfgField[]} */ fields, /** @type {string} */ cols)}
				<div class="grid grid-cols-2 gap-3 {cols}">
					{#each fields as f}
						<label class="flex flex-col gap-1">
							<span
								class="flex items-center gap-1 text-xs font-medium text-base-content/60"
								title={f.hint ?? ''}
							>
								{f.label}
								{#if f.caution}
									<span class="badge badge-warning badge-xs" title="dominant — mit Vorsicht ändern"
										>⚠ Vorsicht</span
									>
								{/if}
							</span>
							<input
								type="number"
								step={f.int ? '1' : 'any'}
								class="input input-bordered input-sm {f.caution ? 'input-warning' : ''}"
								bind:value={cfgForm[f.key]}
							/>
							{#if f.hint}
								<span class="text-[10px] leading-tight text-base-content/40">{f.hint}</span>
							{/if}
						</label>
					{/each}
				</div>
			{/snippet}

			<!-- Terminplan (examplan) -->
			<section class="flex flex-col gap-2 rounded-lg border border-base-200 p-3">
				<div class="text-xs font-semibold tracking-wide text-base-content/70 uppercase">
					Terminplan · Solver-Gewichte
				</div>
				{@render fieldGrid(EXAM_WEIGHTS, 'sm:grid-cols-3 xl:grid-cols-4')}
			</section>

			<!-- Pre-Plan -->
			<section class="flex flex-col gap-2 rounded-lg border border-base-200 p-3">
				<div class="text-xs font-semibold tracking-wide text-base-content/70 uppercase">
					Pre-Plan
				</div>
				{@render fieldGrid(PREPLAN, 'sm:grid-cols-3 xl:grid-cols-4')}
			</section>

			<!-- Aufsichten (invigplan) -->
			<section class="flex flex-col gap-3 rounded-lg border border-base-200 p-3">
				<div class="text-xs font-semibold tracking-wide text-base-content/70 uppercase">
					Aufsichten
				</div>
				<div class="flex flex-col gap-2">
					<div class="text-xs font-medium text-base-content/50">
						Verfahren (Simulated Annealing)
					</div>
					{@render fieldGrid(NUM_FIELDS, 'sm:grid-cols-3 xl:grid-cols-6')}
				</div>
				<div class="flex flex-col gap-2">
					<div class="text-xs font-medium text-base-content/50">Gewichte</div>
					{@render fieldGrid(WEIGHTS, 'sm:grid-cols-4')}
				</div>
			</section>

			<div>
				<WriteButton class="btn btn-outline btn-sm" disabled={cfgSaving} onclick={saveConfig}>
					{cfgSaving ? 'speichert …' : 'Parameter speichern'}
				</WriteButton>
			</div>
		</div>
	</details>

	<div class="flex items-center gap-3">
		{#if running}
			<button class="btn btn-error btn-sm gap-2" onclick={stop}>
				<span class="loading loading-spinner loading-xs"></span> Abbrechen
			</button>
		{:else}
			<button class="btn btn-primary btn-sm gap-2" onclick={start}>▶ Einteilung starten</button>
		{/if}
		{#if current && current.progress}
			<div class="flex flex-1 items-center gap-3">
				<progress class="progress progress-primary w-48" value={progressPct} max="100"></progress>
				<span class="text-xs tabular-nums text-base-content/70">
					{fmt(current.progress.iteration)} / {fmt(current.progress.total)} · Kosten {current.progress.bestCost?.toFixed?.(
						2
					) ?? current.progress.bestCost} · offen {current.progress.unfilled} ·
					{current.progress.balance ? '⚖ balanciert' : 'nicht balanciert'}
				</span>
			</div>
		{/if}
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
			<div class="text-base-content/40" style="color:#6c7086">
				Bereit. Parameter wählen und „Einteilung starten" drücken.
			</div>
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
</div>

{#if report}
	<div class="mx-2 my-4 flex flex-col gap-4" transition:fade>
		<div class="flex flex-wrap items-center gap-3">
			<h2 class="text-xl font-semibold">Ergebnis-Report</h2>
			{#if dryRun}
				<span class="badge badge-ghost">Probelauf — nichts gespeichert</span>
			{/if}
		</div>

		<!-- Kennzahlen -->
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{#each [{ label: 'Seed', value: report.seed }, { label: 'Iterationen', value: fmt(report.iterations) }, { label: 'gelaufen', value: fmt(report.iterationsRun) }, { label: 'früh gestoppt', value: report.stoppedEarly ? 'ja' : 'nein' }] as stat}
				<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
					<div class="text-xs leading-tight text-base-content/60">{stat.label}</div>
					<div class="text-lg font-semibold tabular-nums">{stat.value}</div>
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
			<!-- Balance -->
			<div
				class="rounded-lg border bg-base-100 p-4 {report.balance.satisfied
					? 'border-success/40'
					: 'border-error/40'}"
			>
				<div class="mb-3 flex items-center justify-between">
					<span class="font-medium">Balance</span>
					<span class="badge {report.balance.satisfied ? 'badge-success' : 'badge-error'}">
						{report.balance.satisfied ? '✓ ±Toleranz erfüllt' : '✗ nicht erfüllt'}
					</span>
				</div>
				<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular-nums">
					<span class="text-base-content/60">Aufsichten</span>
					<span class="text-right">{report.balance.invigilators}</span>
					<span class="text-base-content/60">Toleranz</span>
					<span class="text-right">±{report.balance.toleranceMin} Min.</span>
					<span class="text-base-content/60">in Toleranz</span>
					<span class="text-right text-success">{report.balance.withinTolerance}</span>
					<span class="text-base-content/60">darüber</span>
					<span class="text-right text-warning"
						>{report.balance.over} (max {report.balance.maxOver})</span
					>
					<span class="text-base-content/60">darunter</span>
					<span class="text-right text-warning"
						>{report.balance.under} (max {report.balance.maxUnder})</span
					>
				</div>
			</div>

			<!-- Coverage + Minutes -->
			<div class="flex flex-col gap-3">
				<div
					class="rounded-lg border bg-base-100 p-4 {report.coverage.unfilled === 0
						? 'border-success/40'
						: 'border-error/40'}"
				>
					<div class="mb-3 flex items-center justify-between">
						<span class="font-medium">Abdeckung</span>
						<span class="badge {report.coverage.unfilled === 0 ? 'badge-success' : 'badge-error'}">
							{report.coverage.unfilled === 0
								? '✓ vollständig'
								: `${report.coverage.unfilled} offen`}
						</span>
					</div>
					<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular-nums">
						<span class="text-base-content/60">Positionen</span>
						<span class="text-right">{report.coverage.positions}</span>
						<span class="text-base-content/60">unbesetzt</span>
						<span
							class="text-right {report.coverage.unfilled === 0 ? 'text-success' : 'text-error'}"
							>{report.coverage.unfilled}</span
						>
					</div>
				</div>

				<div class="rounded-lg border border-base-300 bg-base-100 p-4">
					<div class="mb-3 font-medium">
						Minuten <span class="text-xs text-base-content/50"
							>(±{report.minutes.toleranceMin})</span
						>
					</div>
					<div class="grid grid-cols-3 gap-2 text-center text-sm tabular-nums">
						<div class="rounded bg-success/10 p-2">
							<div class="text-lg font-semibold text-success">{report.minutes.withinTolerance}</div>
							<div class="text-[10px] text-base-content/60">in Toleranz</div>
						</div>
						<div class="rounded bg-warning/10 p-2">
							<div class="text-lg font-semibold text-warning">{report.minutes.over}</div>
							<div class="text-[10px] text-base-content/60">darüber</div>
						</div>
						<div class="rounded bg-info/10 p-2">
							<div class="text-lg font-semibold text-info">{report.minutes.under}</div>
							<div class="text-[10px] text-base-content/60">darunter</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
			<!-- Outlier -->
			<div class="rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="mb-3 font-medium">Ausreißer</div>
				{#if report.outliers.length}
					<div class="overflow-x-auto">
						<table class="table table-zebra table-xs">
							<thead>
								<tr>
									<th>ID</th>
									<th class="text-right">geleistet</th>
									<th class="text-right">Soll</th>
									<th class="text-right">offen</th>
									<th class="text-right">%</th>
								</tr>
							</thead>
							<tbody>
								{#each report.outliers as o}
									<tr>
										<td class="tabular-nums">{o.invigilatorID}</td>
										<td class="text-right tabular-nums">{o.doing}</td>
										<td class="text-right tabular-nums">{o.target}</td>
										<td class="text-right tabular-nums">{o.open}</td>
										<td
											class="text-right tabular-nums {o.percent >= 100
												? 'text-success'
												: o.percent >= 80
													? 'text-warning'
													: 'text-error'}">{o.percent?.toFixed?.(0) ?? o.percent}%</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="text-sm text-base-content/50">keine</div>
				{/if}
			</div>

			<!-- Soft-Cost -->
			<div class="rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="mb-3 flex items-center justify-between">
					<span class="font-medium">Soft-Cost</span>
					<span class="badge badge-neutral tabular-nums"
						>Σ {report.softCost.total?.toFixed?.(2) ?? report.softCost.total}</span
					>
				</div>
				{#if report.softCost.breakdown.length}
					{@const maxCost = Math.max(
						...report.softCost.breakdown.map((/** @type {any} */ b) => b.cost),
						1
					)}
					<div class="flex flex-col gap-2">
						{#each report.softCost.breakdown as b}
							<div>
								<div class="flex justify-between text-xs">
									<span class="text-base-content/70">{b.name}</span>
									<span class="tabular-nums">{b.cost?.toFixed?.(2) ?? b.cost}</span>
								</div>
								<progress
									class="progress progress-secondary h-1.5 w-full"
									value={b.cost}
									max={maxCost}
								></progress>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-sm text-base-content/50">keine</div>
				{/if}
			</div>
		</div>

		<!-- Fairness -->
		<div class="rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="mb-3 font-medium">Fairness-Verteilung</div>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each report.fairness as f}
					<div>
						<div class="mb-2 flex items-baseline justify-between">
							<span class="text-sm font-medium capitalize">{f.kind}</span>
							<span class="text-xs text-base-content/50">Σ {f.total} · max {f.max}</span>
						</div>
						<div class="flex flex-col gap-1">
							{#each f.buckets as bucket}
								{@const maxInv = Math.max(
									...f.buckets.map((/** @type {any} */ x) => x.invigilators),
									1
								)}
								<div class="flex items-center gap-2 text-xs">
									<span class="w-8 text-right tabular-nums text-base-content/60"
										>{bucket.count}×</span
									>
									<div class="h-4 flex-1 overflow-hidden rounded bg-base-200">
										<div
											class="h-full bg-primary"
											style="width: {(bucket.invigilators / maxInv) * 100}%"
										></div>
									</div>
									<span class="w-10 tabular-nums text-base-content/70">{bucket.invigilators}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
