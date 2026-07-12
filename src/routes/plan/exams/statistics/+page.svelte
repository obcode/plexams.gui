<script>
	import { pdfDownloadUrl } from '$lib/download/downloads.js';
	import { mkDateShort } from '$lib/jshelper/misc.js';
	import { starttimeHHMM } from '$lib/exam/setExamTime';
	import {
		orderBuckets,
		bucketTone,
		toneFromMinFreeDays,
		barPercent,
		totalCount,
		studentBucketTotal,
		formatShare,
		formatDecimal
	} from '$lib/statistics/spreadStatistics.js';

	let { data } = $props();

	/** @type {any} */
	let stats = $derived(data.stats);

	// Umschalter: 'regular' (normaler Studienverlauf) vs. 'all' (alle Studierenden).
	// Default = regular; der ganze Inhalt rendert den gewählten Scope.
	let scope = $state('regular');
	/** @type {any} */
	let sc = $derived(scope === 'all' ? stats?.all : stats?.regular);

	// Feste Reihenfolge (OVERLAP→THREE_PLUS_FREE) für beide Verteilungs-Diagramme.
	let studentBuckets = $derived(orderBuckets(sc?.studentBuckets));
	let pairBuckets = $derived(orderBuckets(sc?.pairBuckets));
	let examCountBuckets = $derived(sc?.examCountBuckets ?? []);
	let byProgram = $derived(sc?.byProgram ?? []);
	let worstStudents = $derived(sc?.worstStudents ?? []);
	let hasLowSample = $derived(byProgram.some((/** @type {any} */ p) => p.lowSampleSize));

	// Statische Klassen-Maps: dynamisches `bg-${tone}` würde Tailwind wegpurgen.
	/** @type {Record<string, string>} */
	const BAR_BG = {
		error: 'bg-error',
		warning: 'bg-warning',
		success: 'bg-success',
		neutral: 'bg-neutral'
	};
	/** @type {Record<string, string>} */
	const BADGE = {
		error: 'badge-error',
		warning: 'badge-warning',
		success: 'badge-success',
		neutral: 'badge-neutral'
	};
	// KPI-Kachel-Tönung (Rahmen/Hintergrund + Wertfarbe) je Ampelstufe.
	/** @type {Record<string, string>} */
	const KPI_BOX = {
		error: 'border-error/40 bg-error/10',
		warning: 'border-warning/40 bg-warning/10',
		success: 'border-success/40 bg-success/10',
		neutral: 'border-base-300 bg-base-100'
	};
	/** @type {Record<string, string>} */
	const KPI_TEXT = {
		error: 'text-error',
		warning: 'text-warning',
		success: 'text-success',
		neutral: ''
	};
</script>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold">Prüfungsverteilung / Statistik</h1>
			<p class="mt-1 text-sm text-base-content/60">
				Qualitätskennzahlen des aktuellen Terminplans: Wie gut sind die Prüfungen der Studierenden
				zeitlich entzerrt? Konflikt = Überschneidung, „selber Tag" &amp; „aufeinanderfolgend" sind
				eng.
			</p>
			{#if stats}
				<p class="mt-1 text-xs text-base-content/40">
					Konflikt-Schwellen: &lt;&nbsp;{stats.examGapMinutes}&nbsp;min Puffer = Überschneidung,
					&lt;&nbsp;{stats.notTooCloseMinutes}&nbsp;min Start-zu-Start am selben Tag = zu&nbsp;eng.
					Freier Tag = Kalendertag (Wochenende zählt).
				</p>
			{/if}
		</div>
		<a class="btn btn-sm btn-outline" href={pdfDownloadUrl('spread-statistics')}>
			🖨️ Als PDF (für E-Mail)
		</a>
	</div>

	{#if data.loadError}
		<div class="alert alert-error">
			<span>Statistik konnte nicht geladen werden: {data.loadError}</span>
		</div>
	{:else if !stats}
		<div class="rounded-lg border border-base-300 bg-base-100 p-6 text-center text-base-content/60">
			Noch keine geplanten Prüfungen — es liegen keine Verteilungsdaten vor.
		</div>
	{:else}
		<!-- Scope-Umschalter -->
		<div role="tablist" class="tabs tabs-boxed w-fit">
			<button
				role="tab"
				class="tab {scope === 'regular' ? 'tab-active' : ''}"
				onclick={() => (scope = 'regular')}
			>
				Normaler Studienverlauf (≤&nbsp;{stats.maxRegularNonRepeatExams} Nicht-Wdh.-Prüfungen)
			</button>
			<button
				role="tab"
				class="tab {scope === 'all' ? 'tab-active' : ''}"
				onclick={() => (scope = 'all')}
			>
				Alle Studierenden
			</button>
		</div>

		{#if !sc || sc.studentCount === 0}
			<div
				class="rounded-lg border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
			>
				Für diese Auswahl liegen keine Verteilungsdaten vor.
			</div>
		{:else}
			{#if sc.studentsWithUnplannedExams > 0}
				<div class="alert alert-warning">
					<span>
						⚠️ Die Zahlen decken nur <strong>geplante</strong> Prüfungen ab.
						<strong class="tabular-nums">{sc.studentsWithUnplannedExams}</strong>
						Studierende haben noch mindestens eine ungeplante Prüfung.
					</span>
				</div>
			{/if}

			<!-- Leit-KPI + Kennzahlen -->
			<section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<!-- freeDayShare als großes Leit-KPI -->
				<div
					class="flex flex-col justify-center rounded-xl border border-success/40 bg-success/10 p-6 lg:col-span-1"
				>
					<span class="text-sm font-medium text-base-content/70">
						Mind. ein freier Tag zwischen allen Prüfungen
					</span>
					<span class="mt-2 text-5xl font-bold tabular-nums text-success">
						{formatShare(sc.freeDayShare)}
					</span>
					<span class="mt-1 text-xs text-base-content/50">
						Anteil der Studierenden mit ≥ 2 Prüfungen, die durchweg entzerrt sind
					</span>
				</div>

				<!-- restliche KPIs -->
				<div class="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-3">
					{@render kpi(
						'Selber Tag',
						formatShare(sc.sameDayShare),
						'zwei Prüfungen am selben Tag',
						sc.sameDayShare > 0 ? 'warning' : 'neutral'
					)}
					{@render kpi(
						'Ø min. freie Tage',
						formatDecimal(sc.avgMinFreeDays),
						'kleinster Abstand je Studi (Ø)',
						'neutral'
					)}
					{@render kpi(
						'Ø Proximity-Cost',
						formatDecimal(sc.avgProximityCost),
						'Zielgröße des Solvers (kleiner = besser)',
						'neutral',
						'Carter-Index: kleiner = besser'
					)}
					{@render kpi(
						'Konflikte',
						formatShare(sc.conflictShare),
						'Überschneidung / zu eng — sollte 0 sein',
						sc.conflictShare > 0 ? 'error' : 'success'
					)}
					{@render kpi(
						'Studierende',
						String(sc.studentCount),
						'mit ≥ 1 geplanten Prüfung',
						'neutral'
					)}
					{@render kpi(
						'davon ≥ 2 Prüfungen',
						String(sc.multiExamStudentCount),
						'Nenner der Quoten',
						'neutral'
					)}
				</div>
			</section>

			<!-- Verteilung: Studierende nach engstem Abstand -->
			<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex flex-wrap items-baseline justify-between gap-2">
					<h2 class="font-semibold">Studierende nach engstem Prüfungsabstand</h2>
					<span class="text-xs text-base-content/50">
						jede:r Studierende zählt in genau eine Kategorie (schlechtester Abstand)
					</span>
				</div>
				{@render bucketChart(studentBuckets)}
			</section>

			<!-- Optional: alle Paar-Abstände -->
			{#if pairBuckets.length}
				<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="font-semibold">Alle aufeinanderfolgenden Prüfungspaare nach Abstand</h2>
						<span class="text-xs text-base-content/50">jedes Prüfungspaar einzeln gezählt</span>
					</div>
					{@render bucketChart(pairBuckets)}
				</section>
			{/if}

			<!-- Nach Studiengang -->
			{#if byProgram.length}
				<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
					<h2 class="font-semibold">Nach Studiengang</h2>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Studiengang</th>
									<th class="text-right">Studierende</th>
									<th class="text-right">≥ 2 Prüf.</th>
									<th class="text-right">Ø Prüf.</th>
									<th class="text-right">≥ 1 frei</th>
									<th class="text-right">selber Tag</th>
									<th class="text-right">Ø min. frei</th>
								</tr>
							</thead>
							<tbody>
								{#each byProgram as p (p.program)}
									<tr class={p.lowSampleSize ? 'text-base-content/40 italic' : ''}>
										<td class="font-medium">
											{p.program}{#if p.lowSampleSize}<span title="geringe Fallzahl">&nbsp;*</span
												>{/if}
										</td>
										<td class="text-right tabular-nums">{p.studentCount}</td>
										<td class="text-right tabular-nums">{p.multiExamStudentCount}</td>
										<td class="text-right tabular-nums">{formatDecimal(p.avgExamsPerStudent)}</td>
										<td class="text-right tabular-nums">{formatShare(p.freeDayShare)}</td>
										<td
											class="text-right tabular-nums {p.sameDayShare > 0 && !p.lowSampleSize
												? 'text-warning'
												: ''}"
										>
											{formatShare(p.sameDayShare)}
										</td>
										<td class="text-right tabular-nums">{formatDecimal(p.avgMinFreeDays)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if hasLowSample}
						<span class="text-xs text-base-content/50">
							* geringe Fallzahl (&lt; 5) — Anteile mit Vorsicht lesen.
						</span>
					{/if}
				</section>
			{/if}

			<!-- Verteilung nach Prüfungsanzahl -->
			{#if examCountBuckets.length}
				<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
					<h2 class="font-semibold">Studierende nach Prüfungsanzahl</h2>
					{@render countBucketChart(examCountBuckets)}
				</section>
			{/if}

			<!-- Drilldown: am engsten geplante Studierende -->
			{#if worstStudents.length}
				<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="font-semibold">Am engsten geplante Studierende</h2>
						<span class="text-xs text-base-content/50">
							zum Aufklappen — zeigt die Prüfungen der/des Studierenden
						</span>
					</div>
					<div class="flex flex-col gap-1.5">
						{#each worstStudents as s (s.mtknr)}
							{@const tone = toneFromMinFreeDays(s.minFreeDays)}
							<details class="group rounded-lg border border-base-300 bg-base-200/40">
								<summary
									class="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm marker:content-['']"
								>
									<span class="text-base-content/40 transition-transform group-open:rotate-90"
										>▸</span
									>
									<span class="font-medium">{s.name}</span>
									<span class="text-xs text-base-content/50">{s.program} · {s.group}</span>
									<span class="badge badge-sm {BADGE[tone]} ml-auto">{s.worstLabel}</span>
									<span class="badge badge-ghost badge-sm tabular-nums">{s.examCount} Prüf.</span>
								</summary>
								<div class="overflow-x-auto border-t border-base-300 px-3 py-2">
									<table class="table table-xs">
										<thead>
											<tr>
												<th>Termin</th>
												<th>Modul</th>
												<th class="text-right">Dauer</th>
											</tr>
										</thead>
										<tbody>
											{#each s.exams as e (e.ancode)}
												<tr>
													<td class="tabular-nums whitespace-nowrap">
														{mkDateShort(e.starttime)} · {starttimeHHMM(e.starttime)}
													</td>
													<td>{e.module}</td>
													<td class="text-right tabular-nums whitespace-nowrap">
														{e.durationMinutes} min
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</details>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	{/if}
</div>

{#snippet kpi(
	/** @type {string} */ title,
	/** @type {string} */ value,
	/** @type {string} */ hint,
	/** @type {string} */ tone,
	/** @type {string | undefined} */ tip
)}
	<div class="flex flex-col justify-center rounded-lg border p-3 {KPI_BOX[tone]}" title={tip}>
		<span class="text-xs text-base-content/60">{title}</span>
		<span class="mt-0.5 text-2xl font-semibold tabular-nums {KPI_TEXT[tone]}">
			{value}
		</span>
		<span class="mt-0.5 text-[0.7rem] leading-tight text-base-content/40">{hint}</span>
	</div>
{/snippet}

{#snippet bucketChart(/** @type {any[]} */ buckets)}
	{@const total = totalCount(buckets)}
	<div class="flex flex-col gap-2">
		{#each buckets as b (b.key)}
			{@const tone = bucketTone(b.key)}
			<div class="flex items-center gap-3 text-sm">
				<span class="w-56 shrink-0 truncate text-base-content/70" title={b.label}>{b.label}</span>
				<div class="h-4 flex-1 overflow-hidden rounded bg-base-300/50">
					<div
						class="h-full rounded {BAR_BG[tone]}"
						style="width: {barPercent(b.count, total)}%"
					></div>
				</div>
				<span class="w-24 shrink-0 text-right tabular-nums">
					{b.count}
					<span class="text-xs text-base-content/50">({formatShare(b.share)})</span>
				</span>
			</div>
		{/each}
		{#if total === 0}
			<span class="text-xs text-base-content/40">Keine Daten.</span>
		{/if}
	</div>
{/snippet}

{#snippet countBucketChart(/** @type {any[]} */ buckets)}
	{@const total = studentBucketTotal(buckets)}
	<div class="flex flex-col gap-2">
		{#each buckets as b (b.examCount)}
			<div class="flex items-center gap-3 text-sm">
				<span class="w-20 shrink-0 text-right text-base-content/70">{b.label}</span>
				<div class="h-4 flex-1 overflow-hidden rounded bg-base-300/50">
					<div
						class="h-full rounded bg-neutral"
						style="width: {barPercent(b.students, total)}%"
					></div>
				</div>
				<span class="w-24 shrink-0 text-right tabular-nums">
					{b.students}
					<span class="text-xs text-base-content/50">({formatShare(b.share)})</span>
				</span>
			</div>
		{/each}
		{#if total === 0}
			<span class="text-xs text-base-content/40">Keine Daten.</span>
		{/if}
	</div>
{/snippet}
