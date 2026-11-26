<script>
	import { clientErrorMessage } from '#lib/errors/clientErrors.js';
	import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
	import PageIntro from '#lib/help/PageIntro.svelte';
	import Term from '#lib/help/Term.svelte';
	import {
		CLIENT_LOAD_MESSAGE,
		streamErrorMessage,
		streamFailureMessage
	} from '#lib/errors/streamErrors.js';
	import { onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import * as env from '$app/env/public';
	import { refreshAll } from '$app/navigation';
	import ExamConflictsPanel from '#lib/exam/ExamConflictsPanel.svelte';
	import ExamScheduleReportExtras from '#lib/exam/ExamScheduleReportExtras.svelte';
	import DatasetCsvTransfer from '#lib/backup/DatasetCsvTransfer.svelte';
	import WriteButton from '#lib/WriteButton.svelte';
	import GenerationConfigFields from '#lib/semester/GenerationConfigFields.svelte';
	import {
		toGenerationConfigInput,
		EXAM_SCHEDULE_WEIGHT_FIELDS
	} from '#lib/semester/generationConfig.ts';

	let { data } = $props();

	// Konflikt-Diff: vor einem Schreiblauf die Konfliktliste festhalten, danach
	// vergleichen (weg / geblieben / neu).
	/** @type {any[] | null} */
	let conflictSnapshot = null;
	/** @type {{ removed: any[], stayed: any[], added: any[] } | null} */
	let conflictDiff = $state(null);

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
		await refreshAll();
		await tick();
		conflictDiff = computeDiff(before, data.conflicts ?? []);
	}

	// Faustregel: examReport.conflicts/resolvedConflicts (inkl. diffStatus) gehören zu
	// EINEM Lauf. Sobald sich der Plan ändert (Reset o. Ä.), ist dieser Snapshot
	// veraltet — verwerfen, damit der Konflikt-Panel wieder die Dauer-Ansicht aus
	// examScheduleConflicts (data.conflicts, per refreshAll frisch) zeigt.
	function discardRunReport() {
		examReport = null;
		conflictDiff = null;
		conflictSnapshot = null;
	}

	// EXAMS gesperrt (draftSent/examPlanPublished gesetzt) → nur Probelauf erlaubt.
	let examsBlocked = $derived((data.blockedAreas ?? []).includes('EXAMS'));

	// --- Eingaben ---
	/** @type {number | ''} */
	let seed = $state(1);
	// Terminplan: Qualität plateaut bei ~1 Mio.; darüber bringt es nichts (die auf
	// die Iterationszahl normierte Abkühlung kann sogar leicht schlechter werden).
	// Daher enger Bereich 100k–2M statt 1–20 Mio. wie bei den Aufsichten.
	let iterations = $state(1_000_000);
	const ITER_MIN = 100_000;
	const ITER_MAX = 2_000_000;
	const ITER_STEP = 100_000;
	// Warm-Start: bestehenden Plan als Ausgangspunkt behalten (nur verbessern).
	let keepAssigned = $state(false);

	// Zwischenzeit zwischen Prüfungen (Semester-Config; wirkt bei der Generierung).
	// Bearbeiten via Round-Trip über setSemesterConfigInput (kein Einzelfeld-Setter).
	/** @type {number | ''} */
	let examGap = $state(data.semesterConfigInput?.examGapMinutes ?? '');
	let gapBusy = $state(false);
	let gapInfo = $state('');
	let gapError = $state('');
	async function saveGap() {
		if (gapBusy) return;
		const base = data.semesterConfigInput;
		if (!base) {
			gapError = 'Semester-Config nicht geladen.';
			return;
		}
		gapBusy = true;
		gapInfo = '';
		gapError = '';
		const e = base.emails ?? {};
		const input = {
			from: base.from,
			until: base.until,
			examGapMinutes: examGap === '' || examGap == null ? null : Number(examGap),
			startTimes: base.startTimes ?? [],
			forbiddenDays: base.forbiddenDays ?? [],
			jointProgramAllowedTimes: (base.jointProgramAllowedTimes ?? []).map(
				(/** @type {any} */ jt) => ({ program: jt.program, allowedTimes: jt.allowedTimes ?? [] })
			),
			timelagMin: base.timelagMin ?? null,
			notTooCloseMinutes: base.notTooCloseMinutes ?? null,
			emails: {
				profs: e.profs,
				lbas: e.lbas,
				lbasLastSemester: e.lbasLastSemester,
				additionalExamer: e.additionalExamer ?? [],
				fs: e.fs,
				sekr: e.sekr,
				roomManagement: e.roomManagement,
				kdp: e.kdp,
				lbaba: e.lbaba
			}
		};
		try {
			const res = await fetch('/api/semester/setSemesterConfigInput', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				gapError = d?.error || httpErrorMessage(res.status);
				return;
			}
			gapInfo = 'Zwischenzeit gespeichert.';
			await refreshAll();
		} catch (err) {
			gapError = clientErrorMessage(err);
		} finally {
			gapBusy = false;
		}
	}

	// Tageszeiten-meiden-Constraint (Teil der globalen generationConfig). Der Input
	// ist komplett non-null, daher beim Speichern die volle Config zurückschreiben
	// (Round-Trip über data.generationConfig, wie bei examGap/semesterConfigInput).
	let slotTimeMode = $state(data.generationConfig?.slotTimeMode ?? 'AUTO');
	let slotTimeEnforcement = $state(data.generationConfig?.slotTimeEnforcement ?? 'HARD');
	/** @type {number | ''} */
	let slotTimeWeight = $state(data.generationConfig?.slotTimeWeight ?? 20000);
	let slotTimeWinterEarliest = $state(data.generationConfig?.slotTimeWinterEarliest ?? '10:00');
	let slotTimeSummerLatest = $state(data.generationConfig?.slotTimeSummerLatest ?? '14:00');
	/** @type {number | ''} */
	let slotTimeGradientWeight = $state(data.generationConfig?.slotTimeGradientWeight ?? 2.0);
	let slotTimeBusy = $state(false);
	let slotTimeInfo = $state('');
	let slotTimeError = $state('');
	async function saveSlotTime() {
		if (slotTimeBusy) return;
		const g = data.generationConfig;
		if (!g) {
			slotTimeError = 'Generation-Config nicht geladen.';
			return;
		}
		slotTimeBusy = true;
		slotTimeInfo = '';
		slotTimeError = '';
		// Alle übrigen Solver-Felder (Aufsichten, Terminplan-Gewichte, Pre-Plan)
		// verbatim übernehmen, nur die Tageszeiten-Felder ändern.
		const input = toGenerationConfigInput(g, {
			slotTimeMode,
			slotTimeEnforcement,
			slotTimeWeight: slotTimeWeight === '' || slotTimeWeight == null ? 0 : Number(slotTimeWeight),
			slotTimeWinterEarliest,
			slotTimeSummerLatest,
			slotTimeGradientWeight:
				slotTimeGradientWeight === '' || slotTimeGradientWeight == null
					? 0
					: Number(slotTimeGradientWeight)
		});
		try {
			const res = await fetch('/api/semester/setGenerationConfig', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				slotTimeError = d?.error || httpErrorMessage(res.status);
				return;
			}
			slotTimeInfo = 'Tageszeiten-Einstellung gespeichert.';
			await refreshAll();
		} catch (err) {
			slotTimeError = clientErrorMessage(err);
		} finally {
			slotTimeBusy = false;
		}
	}

	// --- Laufzeit-Status ---
	let running = $state(false);
	let writeRun = $state(false); // letzter/aktueller Lauf schreibt in die DB?
	let ignoreRun = $state(false); // Lauf ignoriert Ratings & canShareSlot
	/** @type {string | null} */
	let errorMsg = $state(null);
	let done = $state(false);

	// Terminal: alle Zeilen ausser PROGRESS werden angehaengt; die jeweils letzte
	// PROGRESS-Zeile wird in-place aktualisiert (Spinner-Gefuehl). Fortschritt
	// kommt beim Terminplan als Text (kein strukturiertes progress-Objekt).
	/** @type {{ level: string, html: string }[]} */
	let lines = $state([]);
	/** @type {{ html: string } | null} */
	let current = $state(null);
	/** @type {any} */
	let examReport = $state(null);

	// Zeilen nach Level farblich hervorheben (Catppuccin-Palette passend zum
	// Terminal-Hintergrund). Die Terminplan-Generierung kann eine WARN-Zeile
	// (Warnf) über denselben Stream schicken — die soll sich deutlich von
	// normalen Println-Zeilen abheben.
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
		subscription Generate($dryRun: Boolean!, $seed: Int, $iterations: Int, $ignoreRatings: Boolean, $keepAssigned: Boolean) {
			generateExamSchedule(dryRun: $dryRun, seed: $seed, iterations: $iterations, ignoreRatings: $ignoreRatings, keepAssigned: $keepAssigned) {
				level
				text
				code
				examReport {
					units
					fixed
					placed
					unplaced
					unplacedAncodes
					exahmNtaAncodes
					unplacedReasons {
						ancode
						reason
					}
					hardViolations
					cost
					costByConstraint {
						name
						title
						cost
					}
					iterations
					seed
					stoppedEarly
					written
					conflicts {
						ancode1
						module1
						mainExamer1
						groups1
						isRepeaterExam1
						location1
						slot1 {
							starttime
						}
						ancode2
						module2
						mainExamer2
						groups2
						isRepeaterExam2
						location2
						slot2 {
							starttime
						}
						studentCount
						proximity
						canShareSlot
						infoOnly
						diffStatus
						affectedStudents {
							mtknr
							name
							program
							group
							autoAccepted
							decision
							accepted
						}
					}
					resolvedConflicts {
						ancode1
						module1
						mainExamer1
						ancode2
						module2
						mainExamer2
						studentCount
						proximity
					}
					diagnostics {
						students
						pairs
						overlaps
						tooClose
						sameDay
						nextDay
						within3
						further
						studentsWithTooClose
						studentsWithSameDay
						worstStudentPenalty
						maxSeatsAt
						starttimesUsed
						slotsOverThreshold
						maxExamsAt
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

	/** @param {boolean} dryRun @param {boolean} [ignoreRatings] */
	async function start(dryRun, ignoreRatings = false) {
		if (running) return;
		if (!dryRun && examsBlocked) return;
		lines = [];
		current = null;
		examReport = null;
		errorMsg = null;
		done = false;
		running = true;
		writeRun = !dryRun;
		ignoreRun = ignoreRatings;
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
		} catch {
			errorMsg = CLIENT_LOAD_MESSAGE;
			running = false;
			return;
		}

		unsubscribe = wsClient.subscribe(
			{
				query: SUBSCRIPTION,
				variables: {
					// Seed immer explizit setzen (nicht dem Server-Default überlassen):
					// derselbe Seed erzeugt bei unveränderten Daten/Bewertungen denselben Plan.
					dryRun,
					seed: seed === '' || seed == null ? 1 : Number(seed),
					iterations: Number(iterations),
					ignoreRatings,
					keepAssigned
				}
			},
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = streamFailureMessage(msg.errors);
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
						if (line.level === 'ERROR') {
							// A failed run must not end in a green "fertig": show the
							// reason above the terminal as well.
							const message = streamErrorMessage(line);
							errorMsg = errorMsg ? `${errorMsg}\n${message}` : message;
						}
						if (line.level === 'DONE') done = true;
					}
					scrollToBottom();
				},
				/** @param {any} err */
				error: (err) => {
					errorMsg = streamFailureMessage(err);
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

	// --- Phase-B-Warnung ---
	// Vor einem Schreiblauf prüfen, ob alle geplanten EXaHM/SEB-Prüfungen (Phase A)
	// fixiert sind. Unfixierte werden in Phase B neu platziert (können den Slot
	// wechseln). examRoomsPhaseState.allFixed ist die verlässliche Grundlage
	// (deckt auch nachträglich importierte, unfixierte Prüfungen ab). Ein Probelauf
	// (dryRun) schreibt nichts → keine Warnung.
	/** @type {{ dryRun: boolean, ignoreRatings: boolean } | null} */
	let pendingGen = $state(null);
	/** @type {{ planned: number, fixed: number, allFixed: boolean } | null} */
	let phaseWarnState = $state(null);
	let phaseCheckBusy = $state(false);

	/** @param {boolean} dryRun @param {boolean} [ignoreRatings] */
	async function requestStart(dryRun, ignoreRatings = false) {
		if (running) return;
		if (dryRun) return start(true, ignoreRatings); // Probelauf: keine Warnung
		if (examsBlocked) return;
		phaseCheckBusy = true;
		/** @type {{ planned: number, fixed: number, allFixed: boolean } | null} */
		let st = null;
		try {
			const res = await fetch('/api/room/examRoomsPhaseState');
			const d = await res.json().catch(() => ({}));
			if (res.ok && d?.examRoomsPhaseState) st = d.examRoomsPhaseState;
		} catch {
			// Prüfung fehlgeschlagen → nicht blockieren, direkt generieren.
		} finally {
			phaseCheckBusy = false;
		}
		if (st && st.planned > 0 && !st.allFixed) {
			phaseWarnState = st;
			pendingGen = { dryRun, ignoreRatings };
			return;
		}
		start(false, ignoreRatings);
	}

	function confirmGen() {
		const p = pendingGen;
		phaseWarnState = null;
		pendingGen = null;
		if (p) start(p.dryRun, p.ignoreRatings);
	}
	function cancelGen() {
		phaseWarnState = null;
		pendingGen = null;
	}

	// anderen Seed probieren → anderer Plan (Probelauf); den neuen Seed ins Feld
	// übernehmen, damit man ihn anschließend so schreiben kann.
	function newSuggestion() {
		seed = (seed === '' || seed == null ? 1 : Number(seed)) + 1;
		start(true);
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (wsClient) wsClient.dispose();
	});

	// --- Terminplan zurücksetzen (destruktiv) ---
	let resetBusy = $state(false);
	let resetInfo = $state('');
	let resetError = $state('');
	async function resetSchedule() {
		if (resetBusy || examsBlocked) return;
		if (
			!confirm(
				'Generierten Terminplan zurücksetzen? Alle generierten Termine werden gelöscht; nur Prüfungen mit im Prüfungsplan fixiertem Termin, fixierte EXaHM/SEB-Prüfungen und die Prüfungen anderer FKs behalten ihren Termin. Das lässt sich nicht rückgängig machen.'
			)
		)
			return;
		resetBusy = true;
		resetInfo = '';
		resetError = '';
		try {
			const res = await fetch('/api/slot/resetExamSchedule', { method: 'POST' });
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				resetError = d?.error || httpErrorMessage(res.status);
				return;
			}
			resetInfo = `${fmt(d.resetExamSchedule)} Prüfung(en) aus dem Plan entfernt.`;
			// Lauf-Report gehört zum alten Plan → verwerfen, danach live nachladen.
			discardRunReport();
			await refreshAll();
		} catch (e) {
			resetError = clientErrorMessage(e);
		} finally {
			resetBusy = false;
		}
	}

	/** @param {number} n */
	const fmt = (n) => (n ?? 0).toLocaleString('de-DE');

	const KIND_BADGE = /** @type {Record<string, string>} */ ({
		hard: 'badge-error',
		soft: 'badge-info'
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<PageIntro title="Terminplan generieren" help="schritt-examScheduleGenerated">
		{#snippet actions()}
			{#if running}
				<span class="badge badge-info gap-2">
					<span class="loading loading-spinner loading-xs"></span> läuft …
				</span>
				{#if writeRun}
					<span class="badge badge-warning">speichert</span>
				{:else}
					<span class="badge badge-ghost">Probelauf (speichert nichts)</span>
				{/if}
				{#if ignoreRun}
					<span class="badge badge-ghost">ohne Bewertungen</span>
				{/if}
				{#if keepAssigned}
					<span class="badge badge-ghost">verbessert den bestehenden Plan</span>
				{/if}
			{:else if done && !errorMsg}
				<span class="badge badge-success">fertig</span>
			{/if}
		{/snippet}
		Hier gibt Plexams allen übrigen Prüfungen Tag und Uhrzeit, so dass möglichst wenige Studierende zwei
		Prüfungen gleichzeitig oder kurz nacheinander haben. Vorher müssen die Prüfungen
		<Term id="aufbereitete-pruefung">aufbereitet</Term>, die Termine der Prüfungen anderer FKs
		eingetragen und die EXaHM/SEB-Prüfungen fixiert sein. Danach liest du unten die verbleibenden
		<Term id="konflikt">Konflikte</Term>, akzeptierst vertretbare und besserst im Prüfungsplan von
		Hand nach.
		{#snippet howto()}
			<ol>
				<li>„Probelauf“ starten und den Bericht lesen: nicht eingeplante Prüfungen, Konflikte.</li>
				<li>
					Gefällt der Plan nicht, „Neuer Vorschlag“ probiert einen anderen Startwert; Konflikte, die
					in Ordnung sind (z. B. bei Wiederholungsprüfungen), unten je Studierende:n akzeptieren.
				</li>
				<li>Passt das Ergebnis, mit demselben Startwert „Generieren &amp; speichern“.</li>
				<li>Danach „Terminplanung validieren“ laufen lassen und im Prüfungsplan nachbessern.</li>
			</ol>
		{/snippet}
	</PageIntro>

	<details class="w-fit">
		<summary class="cursor-pointer text-sm text-base-content/60">
			📄 Als CSV exportieren / importieren (Bewertungen der Konflikte, „darf zeitgleich“)
		</summary>
		<div class="mt-2 flex flex-col gap-3">
			<DatasetCsvTransfer name="conflict-ratings" title="Bewertungen der Konflikte">
				Je Studierende:r und Prüfungspaar: akzeptiert (ACCEPT) oder ausdrücklich nicht (VETO).
			</DatasetCsvTransfer>
			<DatasetCsvTransfer name="can-share-slot" title="„darf zeitgleich“">
				Prüfungspaare, die zur selben Zeit liegen dürfen.
			</DatasetCsvTransfer>
		</div>
	</details>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Die Daten der Seite konnten nicht geladen werden.</span>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	{#if examsBlocked}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				🔒 Terminplan gesperrt: Der Entwurf ist verschickt oder der Prüfungsplan veröffentlicht.
				Speichern und Zurücksetzen sind deshalb ausgeschaltet, der Probelauf geht weiter. Soll
				wirklich neu generiert werden, zuerst auf der Startseite das Häkchen beim jeweiligen Schritt
				zurücknehmen.
			</span>
		</div>
	{/if}

	<!-- Eingaben -->
	<div class="flex flex-wrap items-end gap-6 rounded-lg border border-base-300 bg-base-100 p-4">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Startwert (Seed)</span>
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
				<span class="text-xs font-medium text-base-content/60">Durchläufe</span>
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
				Voreinstellung 1 Mio.; mehr bringt meist nichts. 100.000 dauern etwa 0,3 s (schnelle
				Vorschau), 1 Mio. etwa 3 s.
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
				bestehenden Plan nur verbessern
			</span>
			<span class="text-xs text-base-content/50">
				Geht vom gespeicherten Plan aus und übernimmt nur Änderungen, die ihn besser machen.
				Sinnvoll nach kleinen Anpassungen von Hand; für einen ganz neuen Plan ausgeschaltet lassen.
			</span>
		</label>
	</div>

	<!-- Zwischenzeit zwischen Prüfungen (Semester-Config; wirkt bei der Generierung) -->
	<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">
					Zwischenzeit zwischen Prüfungen (Minuten)
				</span>
				<input
					type="number"
					min="0"
					class="input input-bordered input-sm w-32"
					bind:value={examGap}
					placeholder="Standard 30"
					disabled={gapBusy}
				/>
			</label>
			<button class="btn btn-outline btn-sm" disabled={gapBusy} onclick={saveGap}>
				{gapBusy ? 'speichert …' : 'speichern'}
			</button>
			{#if gapInfo}<span class="text-xs text-success">{gapInfo}</span>{/if}
			{#if gapError}<span class="text-xs text-error">{gapError}</span>{/if}
		</div>
		<span class="max-w-3xl text-xs text-base-content/50">
			So viele Minuten liegen mindestens zwischen dem Ende der einen und dem Beginn der nächsten
			Prüfung einer Person (bei verschiedenen Standorten gilt die Reisezeit aus der
			Semester-Konfiguration). Leer heißt 30. Bei Startzeiten im Abstand von zwei Stunden passen
			dann 90-Minuten-Prüfungen noch direkt hintereinander; ein größerer Wert schließt mehr Termine
			aus. Wird in der Semester-Konfiguration gespeichert und wirkt ab dem nächsten Lauf.
		</span>
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
				disabled={examsBlocked || phaseCheckBusy}
				onclick={() => requestStart(false)}
				title={examsBlocked
					? 'gesperrt — siehe Hinweis oben'
					: 'speichert den Plan mit diesem Startwert, also dasselbe Ergebnis wie der Probelauf mit demselben Startwert'}
			>
				▶ Generieren &amp; speichern
			</button>
			<button
				class="btn btn-ghost btn-sm"
				onclick={newSuggestion}
				title="Probelauf mit dem nächsten Startwert, ergibt einen anderen Plan"
			>
				🎲 Neuer Vorschlag
			</button>
			<button
				class="btn btn-ghost btn-sm"
				disabled={examsBlocked || phaseCheckBusy}
				onclick={() => requestStart(false, true)}
				title={examsBlocked
					? 'gesperrt — siehe Hinweis oben'
					: 'generiert und speichert, ohne für diesen Lauf die Bewertungen der Konflikte und „darf zeitgleich“ zu beachten; die Bewertungen selbst bleiben gespeichert'}
			>
				↺ Neu generieren ohne Bewertungen
			</button>
			{#if phaseCheckBusy}<span class="loading loading-spinner loading-xs"></span>{/if}
		{/if}
		<span class="text-xs text-base-content/50">
			Der Probelauf speichert nichts. „Generieren &amp; speichern“ überschreibt die Termine aller
			Prüfungen außer denen mit im Prüfungsplan fixiertem Termin, den fixierten EXaHM/SEB-Prüfungen
			und denen anderer FKs; was dabei keinen Termin findet, verliert seinen alten. Derselbe
			Startwert ergibt bei unveränderten Daten und Bewertungen denselben Plan.
		</span>
	</div>

	<!-- Zurücksetzen (destruktiv) -->
	<div class="flex flex-col gap-1 border-t border-base-300 pt-2">
		<div class="flex flex-wrap items-center gap-3">
			<WriteButton
				class="btn btn-outline btn-error btn-sm"
				disabled={examsBlocked || resetBusy}
				title={examsBlocked ? 'Plan veröffentlicht — Zurücksetzen gesperrt' : ''}
				onclick={resetSchedule}
			>
				{resetBusy ? 'Setzt zurück…' : 'Generierten Terminplan zurücksetzen'}
			</WriteButton>
			<span class="text-xs text-base-content/50">
				Löscht die generierten Termine. Prüfungen mit im Prüfungsplan fixiertem Termin, fixierte
				EXaHM/SEB-Prüfungen und die Prüfungen anderer FKs bleiben. Sollen auch die EXaHM/SEB-Termine
				weg, vorher unter „EXaHM/SEB in T-Bau planen“ die Fixierung aufheben.
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
			<span class="whitespace-pre-line">{errorMsg}</span>
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
				Bereit. „Probelauf“ oder „Generieren &amp; speichern“ starten; hier erscheint dann der
				Verlauf.
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
	{#if examReport}
		{@const r = examReport}
		{@const d = r.diagnostics ?? {}}
		{@const infoByAncode = Object.fromEntries(
			(r.conflicts ?? []).flatMap((/** @type {any} */ c) => [
				[c.ancode1, { module: c.module1, mainExamer: c.mainExamer1 }],
				[c.ancode2, { module: c.module2, mainExamer: c.mainExamer2 }]
			])
		)}
		<div class="flex flex-col gap-4" transition:fade>
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-xl font-semibold">Ergebnis-Report</h2>
				<span class="badge badge-outline gap-1 tabular-nums" title="verwendeter Seed">
					Seed {r.seed}
				</span>
				{#if r.written}
					<span class="badge badge-success">gespeichert</span>
				{:else}
					<span class="badge badge-ghost">Probelauf — nichts gespeichert</span>
				{/if}
				{#if r.stoppedEarly}<span class="badge badge-ghost">früh gestoppt</span>{/if}
			</div>

			<!-- Kennzahlen -->
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
				{#each [{ label: 'Prüfungen', value: fmt(r.units) }, { label: 'eingeplant', value: fmt(r.placed) }, { label: 'fester Termin', value: fmt(r.fixed) }, { label: 'nicht eingeplant', value: fmt(r.unplaced) }, { label: 'Strafpunkte', value: fmt(r.cost) }, { label: 'Durchläufe', value: fmt(r.iterations) }] as stat}
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs leading-tight text-base-content/60">{stat.label}</div>
						<div class="text-lg font-semibold tabular-nums">{stat.value}</div>
					</div>
				{/each}
			</div>

			<!-- harte Verletzungen (sollten 0 sein) -->
			{#if r.hardViolations > 0}
				<div class="alert alert-error py-2 text-sm">
					<span>
						<strong>{fmt(r.hardViolations)}</strong> harte Regel(n) verletzt: Der Plan ist nicht gültig
						und wird nicht gespeichert. Welche, steht im Verlauf oben.
					</span>
				</div>
			{:else}
				<div class="alert alert-success py-2 text-sm">
					<span>Alle harten Regeln sind eingehalten.</span>
				</div>
			{/if}

			<!-- NTA-Raum-Hinweis + Gründe für nicht geplante Prüfungen -->
			<ExamScheduleReportExtras
				exahmNtaAncodes={r.exahmNtaAncodes ?? []}
				unplacedReasons={r.unplacedReasons ?? []}
				{infoByAncode}
			/>

			<!-- ungeplante Prüfungen (Fallback ohne strukturierte Gründe) -->
			{#if !(r.unplacedReasons ?? []).length && (r.unplacedAncodes ?? []).length}
				<div class="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/10 p-3">
					<span class="text-sm font-medium">
						Nicht eingeplante Prüfungen ({r.unplacedAncodes.length})
					</span>
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
						<div class="text-xs text-base-content/60">zu nah</div>
						<div class="text-lg font-semibold tabular-nums">{fmt(d.tooClose)}</div>
						<div class="text-xs text-base-content/50">
							{fmt(d.studentsWithTooClose)} Studierende betroffen
						</div>
					</div>
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="text-xs text-base-content/60">selber Tag (sameDay)</div>
						<div class="text-lg font-semibold tabular-nums">{fmt(d.sameDay)}</div>
						<div class="text-xs text-base-content/50">
							{fmt(d.studentsWithSameDay)} Studierende betroffen
						</div>
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
					<div
						class="rounded border px-2 py-1 {d.overlaps > 0
							? 'border-error/40 bg-error/10'
							: 'border-base-200'}"
						title="Überschneidungen (gleichzeitig geprüft) — sollte 0 sein"
					>
						<span class="text-base-content/50">Überschneidungen</span>
						<span class="ml-1 font-medium tabular-nums {d.overlaps > 0 ? 'text-error' : ''}">
							{fmt(d.overlaps)}
						</span>
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

				<h3 class="mt-2 font-semibold">Auslastung je Startzeit</h3>
				<div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">Startzeiten genutzt</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.starttimesUsed)}</span>
					</div>
					<div
						class="rounded border border-base-200 px-2 py-1"
						title="größte Zahl gleichzeitig (zur selben Startzeit) geprüfter Studierender"
					>
						<span class="text-base-content/50">max. Plätze gleichzeitig</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.maxSeatsAt)}</span>
					</div>
					<div class="rounded border border-base-200 px-2 py-1">
						<span class="text-base-content/50">max. Prüfungen/Startzeit</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.maxExamsAt)}</span>
					</div>
					<div
						class="rounded border border-base-200 px-2 py-1"
						title="Startzeiten über der Platz-Schwelle (Max. Plätze pro Startzeit)"
					>
						<span class="text-base-content/50">über Schwelle</span>
						<span class="ml-1 font-medium tabular-nums">{fmt(d.slotsOverThreshold)}</span>
					</div>
				</div>
			</div>

			<!-- Strafpunkte je Regel -->
			{#if (r.costByConstraint ?? []).length}
				<details class="collapse-arrow collapse border border-base-300 bg-base-100">
					<summary class="collapse-title text-sm font-medium">Strafpunkte je Regel</summary>
					<div class="collapse-content">
						<div class="overflow-x-auto rounded-lg border border-base-200">
							<table class="table table-sm">
								<thead><tr><th>Regel</th><th class="text-right">Strafpunkte</th></tr></thead>
								<tbody>
									{#each r.costByConstraint as cc}
										<tr>
											<td>{cc.title ?? cc.name}</td>
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

	<!-- Konflikt-Bewertungs-Loop — nach einem Lauf die Konflikte des gerade
	     erzeugten Plans (examReport.conflicts, auch im Probelauf), sonst die des
	     gespeicherten Plans (examScheduleConflicts aus dem Load). -->
	<ExamConflictsPanel
		conflicts={examReport?.conflicts ?? data.conflicts}
		resolvedConflicts={examReport?.resolvedConflicts ?? []}
		sourceLabel={examReport?.conflicts
			? examReport.written
				? 'aus dem gerade geschriebenen Plan'
				: 'aus dem letzten Probelauf (nicht gespeichert)'
			: 'aus dem gespeicherten Plan'}
		decisions={data.decisions}
		suggestions={data.suggestions}
		shareList={data.shareList}
		loadError={data.conflictsError}
	/>

	<!-- Tageszeit-Fenster (Teil der globalen generationConfig) -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-baseline gap-2">
			<span class="font-medium">Tageszeit-Fenster</span>
			<span class="text-xs text-base-content/50">
				· gilt für alle Semester · wirkt ab dem nächsten Lauf
			</span>
		</div>
		<div class="flex flex-wrap items-end gap-4">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Tageszeit-Fenster</span>
				<select
					class="select select-bordered select-sm w-52"
					bind:value={slotTimeMode}
					disabled={slotTimeBusy || !data.generationConfig}
					title="AUTO folgt dem Semester (Winter: nicht zu früh; Sommer: nicht zu spät)."
				>
					<option value="AUTO">Automatik (nach Semester)</option>
					<option value="WINTER">Winter (nicht zu früh)</option>
					<option value="SUMMER">Sommer (nicht zu spät)</option>
					<option value="OFF">Aus</option>
				</select>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Zeitfenster erzwingen</span>
				<select
					class="select select-bordered select-sm w-64"
					bind:value={slotTimeEnforcement}
					disabled={slotTimeBusy || !data.generationConfig || slotTimeMode === 'OFF'}
					title="HARD: außerhalb des Fensters gezwungene Prüfungen bleiben ungeplant (mit Begründung im Report). SOFT: Abweichung möglich, wird über die Fenster-Strafe bewertet."
				>
					<option value="HARD">hart (Prüfung sonst ungeplant)</option>
					<option value="SOFT">weich (Abweichung möglich, wird gemeldet)</option>
				</select>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Winter: frühester Beginn</span>
				<input
					type="time"
					class="input input-bordered input-sm w-28"
					bind:value={slotTimeWinterEarliest}
					disabled={slotTimeBusy || !data.generationConfig || slotTimeMode === 'OFF'}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Sommer: spätester Beginn</span>
				<input
					type="time"
					class="input input-bordered input-sm w-28"
					bind:value={slotTimeSummerLatest}
					disabled={slotTimeBusy || !data.generationConfig || slotTimeMode === 'OFF'}
					title="Gebuchte, klimatisierte T-Bau-Räume (EXaHM/SEB) sind ausgenommen."
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span
					class="text-xs font-medium text-base-content/60"
					class:opacity-40={slotTimeEnforcement === 'HARD'}
				>
					Fenster-Strafe (nur im SOFT-Modus)
				</span>
				<input
					type="number"
					step="any"
					min="0"
					class="input input-bordered input-sm w-32"
					bind:value={slotTimeWeight}
					disabled={slotTimeBusy ||
						!data.generationConfig ||
						slotTimeMode === 'OFF' ||
						slotTimeEnforcement === 'HARD'}
					title="Strafgewicht bei Abweichung vom Fenster. Nur im SOFT-Modus wirksam; im HARD-Modus wirkungslos."
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Sommer: milder Früh-Sog</span>
				<input
					type="number"
					step="any"
					min="0"
					class="input input-bordered input-sm w-32"
					bind:value={slotTimeGradientWeight}
					disabled={slotTimeBusy || !data.generationConfig || slotTimeMode === 'OFF'}
					title="Zieht große Prüfungen innerhalb des Fensters nach vorn. Nur im Sommer relevant."
				/>
			</label>
			<button
				class="btn btn-outline btn-sm"
				disabled={slotTimeBusy || !data.generationConfig}
				onclick={saveSlotTime}
			>
				{slotTimeBusy ? 'speichert …' : 'speichern'}
			</button>
			{#if slotTimeInfo}<span class="text-xs text-success">{slotTimeInfo}</span>{/if}
			{#if slotTimeError}<span class="text-xs text-error">{slotTimeError}</span>{/if}
		</div>
		<span class="max-w-3xl text-xs text-base-content/50">
			Begrenzt, wann Prüfungen beginnen dürfen. <strong>Automatik</strong> richtet sich nach dem
			Semester: Im Wintersemester beginnt keine Prüfung vor „Winter: frühester Beginn“, im
			Sommersemester keine nach „Sommer: spätester Beginn“. Bei <strong>hart</strong> bleibt eine
			Prüfung, die nur außerhalb des Fensters Platz fände, lieber ohne Termin; der Bericht nennt
			dann den Grund. Bei <strong>weich</strong> ist eine Abweichung möglich, kostet aber Strafpunkte
			(„Fenster-Strafe“) und wird gemeldet. Der „milde Früh-Sog“ zieht große Prüfungen im Sommer innerhalb
			des Fensters nach vorn. EXaHM/SEB-Prüfungen in den klimatisierten T-Bau-Räumen sind ausgenommen.
		</span>
	</div>

	<!-- Terminplan-Solver-Gewichte (Teil der globalen generationConfig) -->
	<details class="collapse-arrow collapse border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			⚙️ Feineinstellung (Gewichte)
			<span class="font-normal text-base-content/50">
				· gilt für alle Semester · wirkt ab dem nächsten Lauf
			</span>
		</summary>
		<div class="collapse-content flex flex-col gap-3">
			<div class="max-w-3xl text-xs text-base-content/50">
				Feinjustierung der Terminplan-Optimierung. Alle Werte sind mit sinnvollen Defaults vorbelegt
				— nur bei Bedarf ändern. <strong>„ungeplante Prüfung"</strong> ist dominant und sollte hoch bleiben.
				Die T-Bau-Gewichtung der Phase A steht auf „EXaHM/SEB in T-Bau planen".
			</div>
			<GenerationConfigFields
				config={data.generationConfig}
				sections={[{ fields: EXAM_SCHEDULE_WEIGHT_FIELDS }]}
			/>
		</div>
	</details>

	<!-- Angewandte Constraints (read-only) -->
	<details class="collapse-arrow collapse border border-base-300 bg-base-100">
		<summary class="collapse-title text-sm font-medium">
			Angewandte Regeln
			<span class="font-normal text-base-content/50">
				· {(data.constraints ?? []).length} · nur zur Ansicht
			</span>
		</summary>
		<div class="collapse-content">
			<div class="overflow-x-auto rounded-lg border border-base-200">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Rang</th>
							<th>Art</th>
							<th>Regel</th>
							<th>Beschreibung</th>
							<th class="text-right">Gewicht</th>
						</tr>
					</thead>
					<tbody>
						{#each data.constraints ?? [] as c}
							<tr>
								<td class="tabular-nums">{c.tier}</td>
								<td>
									<span class="badge badge-sm {KIND_BADGE[c.kind] ?? 'badge-ghost'}">
										{c.kind === 'hard' ? 'hart' : c.kind === 'soft' ? 'weich' : c.kind}
									</span>
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

<!-- Phase-B-Warnung: unfixierte EXaHM/SEB-Prüfungen können den Slot wechseln -->
{#if phaseWarnState}
	<div class="modal modal-open" role="dialog">
		<div class="modal-box">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				<span class="text-warning">⚠️</span> EXaHM/SEB nicht vollständig fixiert
			</h3>
			<p class="py-3 text-sm">
				Es sind erst <strong class="tabular-nums">{phaseWarnState.fixed}</strong> von
				<strong class="tabular-nums">{phaseWarnState.planned}</strong>
				EXaHM/SEB-Prüfungen fixiert. Die übrigen plant der Generator neu ein; sie können dabei einen anderen
				Termin bekommen als auf der Seite „EXaHM/SEB in T-Bau planen“. Trotzdem generieren und speichern?
			</p>
			<p class="pb-2 text-xs text-base-content/50">
				Tipp: Auf der Seite „EXaHM/SEB in T-Bau planen“ zuerst „EXaHM/SEB fixieren“.
			</p>
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={cancelGen}>Abbrechen</button>
				<button class="btn btn-warning btn-sm" onclick={confirmGen}>Trotzdem generieren</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="Abbrechen" onclick={cancelGen}></button>
	</div>
{/if}
