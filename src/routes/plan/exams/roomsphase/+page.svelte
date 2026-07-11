<script>
	import { onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { env } from '$env/dynamic/public';
	import WriteButton from '$lib/WriteButton.svelte';
	import GenerationConfigFields from '$lib/semester/GenerationConfigFields.svelte';
	import { ROOM_PHASE_A_WEIGHT_FIELDS } from '$lib/semester/generationConfig';

	let { data } = $props();

	// EXAMS gesperrt → nur Probelauf; Schreiben/Fixieren deaktiviert.
	let examsBlocked = $derived((data.blockedAreas ?? []).includes('EXAMS'));

	// --- Eingaben (wie normale Generierung) ---
	/** @type {number | ''} */
	let seed = $state(1);
	let iterations = $state(1_000_000);
	const ITER_MIN = 100_000;
	const ITER_MAX = 2_000_000;
	const ITER_STEP = 100_000;

	// --- Laufzeit-Status ---
	let running = $state(false);
	let writeRun = $state(false);
	/** @type {string | null} */
	let errorMsg = $state(null);
	let done = $state(false);

	/** @type {{ level: string, html: string }[]} */
	let lines = $state([]);
	/** @type {{ html: string } | null} */
	let current = $state(null);
	/** @type {any} */
	let examReport = $state(null);

	/** @type {HTMLDivElement | undefined} */
	let termEl = $state();
	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

	const SUBSCRIPTION = `
		subscription Phase($dryRun: Boolean!, $seed: Int, $iterations: Int) {
			generateExamRoomsPhase(dryRun: $dryRun, seed: $seed, iterations: $iterations) {
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
					iterations
					seed
					stoppedEarly
					written
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
					seed: seed === '' || seed == null ? 1 : Number(seed),
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
					const line = msg.data && msg.data.generateExamRoomsPhase;
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

	// --- Fixieren / Aufheben ---
	let fixBusy = $state(false);
	let fixError = $state('');
	/** @type {string} */
	let fixInfo = $state('');
	/** @param {string} path @param {(d:any)=>string} msg */
	async function fixAction(path, msg) {
		if (fixBusy) return;
		fixBusy = true;
		fixError = '';
		fixInfo = '';
		try {
			const res = await fetch(`/api/room/${path}`, { method: 'POST' });
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				fixError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			fixInfo = msg(d);
		} catch (e) {
			fixError = e instanceof Error ? e.message : String(e);
		} finally {
			fixBusy = false;
		}
	}
	const doFix = () =>
		fixAction(
			'fixExamRoomsPhase',
			(d) => `${fmt(d.fixExamRoomsPhase)} Prüfung(en) fixiert (überleben Phase B).`
		);
	const doUnfix = () => fixAction('unfixExamRoomsPhase', () => 'Fixierung aufgehoben.');
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">EXaHM/SEB in T-Bau planen (Phase A)</h1>
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

	<p class="max-w-3xl text-sm text-base-content/60">
		Erster Schritt der Terminplanung: die EXaHM/SEB-Prüfungen in den T-Bau legen. Empfohlen: erst
		Probelauf, dann echt. Passt das Ergebnis, mit „EXaHM/SEB fixieren" festhalten — die fixierten
		Prüfungen werden im anschließenden Terminplan (Phase B) nicht mehr verschoben.
	</p>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Daten konnten nicht geladen werden (Backend-Fehler).</span>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	{#if examsBlocked}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				🔒 Gesperrt — Entwurf verschickt oder Prüfungsplan veröffentlicht. Schreiben und Fixieren
				sind deaktiviert; der Probelauf bleibt möglich. Zum Neuschreiben zuerst das jeweilige
				Häkchen auf der Startseite lösen.
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
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		{#if running}
			<button class="btn btn-error btn-sm gap-2" onclick={stop}>
				<span class="loading loading-spinner loading-xs"></span> Abbrechen
			</button>
		{:else}
			<button class="btn btn-outline btn-sm" onclick={() => start(true)}>▷ Probelauf</button>
			<button
				class="btn btn-primary btn-sm"
				disabled={examsBlocked}
				onclick={() => start(false)}
				title={examsBlocked ? 'gesperrt — siehe Hinweis oben' : ''}
			>
				▶ Planen &amp; schreiben
			</button>
		{/if}
		<span class="text-xs text-base-content/50">
			Derselbe Seed erzeugt bei unveränderten Daten denselben Plan.
		</span>
	</div>

	<!-- Phase-A-Solver-Gewicht (Teil der globalen generationConfig) -->
	<details class="collapse-arrow collapse border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			⚙️ Solver-Gewicht (T-Bau)
			<span class="font-normal text-base-content/50">· global · wirkt beim nächsten „Planen"</span>
		</summary>
		<div class="collapse-content flex flex-col gap-3">
			<div class="max-w-3xl text-xs text-base-content/50">
				Steuert nur die Raumphase A: wie stark ungenutzte gebuchte T-Bau-Sitze bestraft werden
				(füllt den T-Bau dichter). Mit sinnvollem Default vorbelegt — nur bei Bedarf ändern.
			</div>
			<GenerationConfigFields
				config={data.generationConfig}
				sections={[{ cols: 'sm:grid-cols-2 xl:grid-cols-3', fields: ROOM_PHASE_A_WEIGHT_FIELDS }]}
			/>
		</div>
	</details>

	{#if errorMsg}
		<div class="alert alert-error" transition:fade><span>{errorMsg}</span></div>
	{/if}

	<!-- Terminal -->
	<div
		bind:this={termEl}
		class="h-96 overflow-auto rounded-lg border border-base-300 p-3 font-mono text-xs leading-relaxed"
		style="background:#1e1e2e; color:#d4d4d4"
	>
		{#if !lines.length && !current && !running}
			<div style="color:#6c7086">
				Bereit. Parameter wählen und „Probelauf" oder „Planen" starten.
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

	<!-- Ergebnis-Report -->
	{#if examReport}
		{@const r = examReport}
		<div class="flex flex-col gap-4" transition:fade>
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-xl font-semibold">Ergebnis-Report</h2>
				<span class="badge badge-outline gap-1 tabular-nums" title="verwendeter Seed">
					Seed {r.seed}
				</span>
				{#if r.written}
					<span class="badge badge-success">in DB geschrieben</span>
				{:else}
					<span class="badge badge-ghost">Probelauf — nichts gespeichert</span>
				{/if}
				{#if r.stoppedEarly}<span class="badge badge-ghost">früh gestoppt</span>{/if}
			</div>

			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
				{#each [{ label: 'Prüfungen', value: fmt(r.units) }, { label: 'platziert', value: fmt(r.placed) }, { label: 'fest', value: fmt(r.fixed) }, { label: 'übrig (SEB)', value: fmt(r.unplaced) }, { label: 'Kosten', value: fmt(r.cost) }, { label: 'Iterationen', value: fmt(r.iterations) }] as stat}
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs leading-tight text-base-content/60">{stat.label}</div>
						<div class="text-lg font-semibold tabular-nums">{stat.value}</div>
					</div>
				{/each}
			</div>

			{#if r.hardViolations > 0}
				<div class="alert alert-error py-2 text-sm">
					<span><strong>{fmt(r.hardViolations)}</strong> harte Verletzung(en).</span>
				</div>
			{/if}

			{#if (r.unplacedAncodes ?? []).length}
				<div class="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/10 p-3">
					<span class="text-sm font-medium">
						Übrige SEB-Prüfungen — passten nicht in den T-Bau ({r.unplacedAncodes.length})
					</span>
					<div class="flex flex-wrap gap-1">
						{#each r.unplacedAncodes as a}
							<span class="badge badge-warning badge-sm tabular-nums">{a}</span>
						{/each}
					</div>
				</div>
			{:else}
				<div class="alert alert-success py-2 text-sm">
					<span>Alle EXaHM/SEB-Prüfungen im T-Bau untergebracht.</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Fixieren -->
	<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-center gap-3">
			<span class="font-medium">Fixieren</span>
			<WriteButton
				class="btn btn-primary btn-sm"
				disabled={examsBlocked || fixBusy}
				title={examsBlocked ? 'gesperrt — siehe Hinweis oben' : ''}
				onclick={doFix}
			>
				EXaHM/SEB fixieren
			</WriteButton>
			<WriteButton
				class="btn btn-ghost btn-sm"
				disabled={examsBlocked || fixBusy}
				onclick={doUnfix}
			>
				Fixierung aufheben
			</WriteButton>
			{#if fixBusy}<span class="loading loading-spinner loading-xs"></span>{/if}
		</div>
		<span class="text-xs text-base-content/50">
			Nach zufriedenstellender Phase A fixieren — die fixierten Prüfungen überleben Phase B
			(Terminplan generieren). „Fixierung aufheben" lässt das manuelle Sperren (Locked)
			unangetastet.
		</span>
		{#if fixInfo}
			<div class="alert alert-success py-2 text-sm"><span>{fixInfo}</span></div>
		{/if}
		{#if fixError}
			<div class="alert alert-error py-2 text-sm"><span>{fixError}</span></div>
		{/if}
	</div>
</div>
