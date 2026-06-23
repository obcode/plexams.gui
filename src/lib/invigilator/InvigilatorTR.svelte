<script>
	export let semesterConfig;
	export let index;
	export let invigilator;
	// forwarded to the calendar: hide Aufsicht/Reserve blocks, show only exams
	export let showInvigilations = true;
	// global duty at 100% workload (before the personal factor); the bars are scaled
	// relative to this, so the "bei 100 %" bar is normally full.
	export let base100 = 0;

	import InvigilatorDays from './InvigilatorDays.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';

	function nameBg(invigilator) {
		if (!invigilator.requirements.fromZpa) {
			return 'bg-red-400';
		}
		if (invigilator.todos.enough) {
			return 'bg-green-400';
		}
		return 'bg-base-200';
	}

	let contribution = 0;
	if (invigilator.requirements) {
		contribution = invigilator.requirements.allContributions;
	}

	let openMinutes = 0;
	$: openMinutes = invigilator.todos.totalMinutes - invigilator.todos.doingMinutes;

	function openColor() {
		if (openMinutes <= 0) {
			return 'progress-success';
		}
		if (openMinutes < 60) {
			return 'progress-warning';
		}
		return 'progress-error';
	}

	// Per-person scale: the 100 % line is the reference (bar runs full). Only if this
	// person actually exceeds 100 % (e.g. must do 150 %) does their own peak become the
	// maximum — so the bars never overflow, but only for that one person.
	const barMax = Math.max(
		base100,
		invigilator.todos.totalMinutes ?? 0,
		invigilator.todos.doingMinutes ?? 0,
		contribution,
		1
	);

	// Abrechnung der Aufsichten: Eigenaufsicht zählt 0, Reserve pauschal 60,
	// sonstige Aufsicht mit ihrer tatsächlichen Dauer. Summe = geleistete Minuten.
	const RESERVE_MINUTES = 60;
	let selfCount = 0;
	let reserveCount = 0;
	let otherCount = 0;
	let reserveMinutes = 0;
	let otherMinutes = 0;
	for (const inv of invigilator.todos?.invigilations ?? []) {
		if (inv.isSelfInvigilation) {
			selfCount++;
		} else if (inv.isReserve) {
			reserveCount++;
			reserveMinutes += RESERVE_MINUTES;
		} else {
			otherCount++;
			otherMinutes += inv.duration ?? 0;
		}
	}
	const billedTotal = reserveMinutes + otherMinutes;

	// factor breakdown as a single clean string (no dangling separators)
	const r = invigilator.requirements;
	/** @type {string[]} */
	const factorParts = [];
	if (r) {
		if (r.partTime != 1) factorParts.push(`Teilzeit ${r.partTime}`);
		if (r.freeSemester != 0) factorParts.push(`Freisemester ${r.freeSemester}`);
		if (r.overtimeLastSemester != 0) factorParts.push(`letztes Sem. ${r.overtimeLastSemester}`);
		if (r.overtimeThisSemester != 0) factorParts.push(`dieses Sem. ${r.overtimeThisSemester}`);
	}
	const factorDetails = factorParts.join(' · ');

	// Anwesenheitstage = Tage, an denen die Person da ist: eigene Prüfungstage
	// (requirements.examDays) UND Aufsichtstage (slot.dayNumber). Nur Aufsichts-
	// tage zu nehmen verliert Prüfungstage mit Fremdaufsicht (dann keine eigene
	// Aufsicht), die im Kalender aber als Prüfung erscheinen.
	const presenceDates = [
		...new Set([
			...(invigilator.requirements?.examDays ?? []),
			...(invigilator.todos?.invigilations ?? [])
				.map((/** @type {{ slot?: { dayNumber: number } }} */ inv) => inv.slot?.dayNumber)
				.filter((/** @type {number | undefined} */ n) => n != null)
		])
	]
		.sort((/** @type {number} */ a, /** @type {number} */ b) => a - b)
		.map((/** @type {number} */ n) => {
			const day = semesterConfig.days.find((/** @type {{ number: number }} */ d) => d.number === n);
			return day ? mkDateShort(day.date) : String(n);
		});
</script>

<div
	class="flex items-stretch gap-3 border-b border-base-300 bg-base-100 py-2"
	data-invig-card
	data-invig-name={invigilator.teacher.id}
>
	<!-- left: textual info + progress bars -->
	<div class="w-72 shrink-0 text-sm">
		<a
			href="/plan/invigilation?focus={invigilator.teacher.id}"
			class="block rounded px-2 py-1 font-bold hover:underline {nameBg(invigilator)}"
			title="ID {invigilator.teacher.id} — im Aufsichtsplan anzeigen"
		>
			{invigilator.teacher.shortname}
		</a>

		{#if invigilator.requirements}
			<!-- all bars first, scaled to the 100 % reference -->
			<div class="mt-1 flex flex-col gap-1 px-2 text-xs">
				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">bei 100 %</span>
					<progress class="progress progress-primary flex-1" value={base100} max={barMax}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums">{base100}</span>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">anrechenbar</span>
					<progress
						class="progress progress-info flex-1"
						value={contribution > 0 ? contribution : 0}
						max={barMax}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums">{contribution}</span>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">zu leisten</span>
					<progress
						class="progress progress-warning flex-1"
						value={invigilator.todos.totalMinutes}
						max={barMax}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums">{invigilator.todos.totalMinutes}</span
					>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">geleistet</span>
					<progress
						class="progress progress-success flex-1"
						value={invigilator.todos.doingMinutes}
						max={barMax}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums"
						>{invigilator.todos.doingMinutes > 0 ? invigilator.todos.doingMinutes : ''}</span
					>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">noch offen</span>
					<progress
						class="progress {openColor()} flex-1"
						value={openMinutes > 0 ? openMinutes : 0}
						max={barMax}
					></progress>
					<span class="w-12 shrink-0 text-right font-semibold tabular-nums">{openMinutes}</span>
				</div>
			</div>

			<!-- textual details below the bars -->
			<div class="mt-2 space-y-1 border-t border-base-200 px-2 pt-2 text-xs">
				{#if invigilator.requirements.factor != 1}
					<div class="flex justify-between">
						<span class="text-gray-500">Faktor</span>
						<span class="tabular-nums">{invigilator.requirements.factor}</span>
					</div>
					{#if factorDetails}
						<div class="text-[11px] text-gray-400">{factorDetails}</div>
					{/if}
				{/if}

				{#if presenceDates.length}
					<div class="flex justify-between gap-2">
						<span class="shrink-0 text-gray-500">Anwesenheitstage</span>
						<span class="text-right">{presenceDates.join(', ')}</span>
					</div>
				{/if}

				<div class="pt-1">
					<div class="mb-1 font-semibold text-gray-600">Abrechnung der Aufsichten</div>
					{#if selfCount || reserveCount || otherCount}
						<div class="space-y-0.5">
							{#if selfCount}
								<div class="flex items-center justify-between">
									<span class="flex items-center gap-1.5">
										<span class="inline-block h-2 w-2 rounded-full bg-violet-300"></span>
										Eigenaufsicht <span class="text-gray-400">×{selfCount}</span>
									</span>
									<span class="tabular-nums text-gray-400">0 Min.</span>
								</div>
							{/if}
							{#if reserveCount}
								<div class="flex items-center justify-between">
									<span class="flex items-center gap-1.5">
										<span class="inline-block h-2 w-2 rounded-full bg-yellow-300"></span>
										Reserve <span class="text-gray-400">×{reserveCount}</span>
									</span>
									<span class="tabular-nums">{reserveMinutes} Min.</span>
								</div>
							{/if}
							{#if otherCount}
								<div class="flex items-center justify-between">
									<span class="flex items-center gap-1.5">
										<span class="inline-block h-2 w-2 rounded-full bg-orange-300"></span>
										Aufsicht <span class="text-gray-400">×{otherCount}</span>
									</span>
									<span class="tabular-nums">{otherMinutes} Min.</span>
								</div>
							{/if}
							<div
								class="mt-0.5 flex items-center justify-between border-t border-base-200 pt-0.5 font-semibold"
							>
								<span>Summe</span>
								<span class="tabular-nums">{billedTotal} Min.</span>
							</div>
						</div>
					{:else}
						<div class="text-gray-400">noch keine Aufsichten</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- right: calendar -->
	<div class="overflow-x-auto">
		<InvigilatorDays {semesterConfig} {invigilator} {showInvigilations} />
	</div>
</div>
