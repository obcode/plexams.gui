<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { mkDateTimeShort } from '$lib/jshelper/misc.js';
	import { mkStarttime } from '$lib/jshelper/misc.js';
	import { onMount } from 'svelte';
	import ExamWithNtAsCard from '$lib/exam/ExamWithNTAsCard.svelte';
	import { planningFk, displayAncode } from '$lib/exam/fk';
	import { Tooltip } from '@svelte-plugins/tooltips';
	let {
		exam,
		maxSlots,
		showExam,
		showAncode,
		showExamerID,
		showOnlyOnline,
		showOnlyExahm,
		showOnlySEB,
		selectedExam,
		selectedExamerID,
		onlyPlannedByMe,
		onlyConflicts,
		details,
		moveable,
		inSlot,
		conflictingAncodes
	} = $props();

	const dispatch = createEventDispatcher();

	let allowedSlots = [];
	let locked = false;

	// $: locked = allowedSlots.length == 0;

	async function fetchAllowedSlots() {
		const response = await fetch('/api/allowedSlots', {
			method: 'POST',
			body: JSON.stringify({ ancode: exam.ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		allowedSlots = data.allowedSlots;
	}

	// let awkwardSlots = [];

	// async function fetchAwkwardSlots() {
	// 	const response = await fetch('/api/awkwardSlots', {
	// 		method: 'POST',
	// 		body: JSON.stringify({ examGroupCode: examGroupCode }),
	// 		headers: {
	// 			'content-type': 'application/json'
	// 		}
	// 	});
	// 	let data = await response.json();
	// 	awkwardSlots = data.awkwardSlots;
	// }

	const selected = $derived(
		selectedExam == exam.ancode || selectedExamerID == exam.zpaExam.mainExamerID
	);
	const sameSlot = $derived(
		exam.constraints != null &&
			exam.constraints.sameSlot != null &&
			exam.constraints.sameSlot.includes(selectedExam)
	);

	let slotToMove = 'none';

	const online = $derived(exam.constraints && exam.constraints.online);
	const exahm = $derived(
		exam.constraints &&
			exam.constraints.roomConstraints &&
			(exam.constraints.roomConstraints.exahm || exam.constraints.roomConstraints.seb)
	);

	const programs: string[] = [];
	for (const primussExam of exam.primussExams) {
		if (primussExam.studentRegs.length > 0) programs.push(primussExam.exam.program);
	}

	const show = $derived.by(() => {
		if (onlyPlannedByMe && exam.constraints != null && exam.constraints.notPlannedByMe) {
			return false;
		}
		if (
			!selected &&
			conflictingAncodes.length > 0 &&
			!conflictingAncodes.includes(exam.ancode) &&
			onlyConflicts
		) {
			return false;
		}
		let s;
		if (showExam == 'all' || conflictingAncodes.includes(exam.ancode)) {
			s = true;
		} else {
			s = programs.includes(showExam);
		}
		if (showExamerID != 'all') s = s && exam.zpaExam.mainExamerID == showExamerID;
		if (showAncode != '0') s = s && exam.ancode == showAncode;
		if (showOnlyOnline) s = online;
		if (showOnlyExahm) s = exahm;
		return s;
	});

	function calcConflictCount(ancode: any) {
		for (const conflict of exam.conflicts) {
			if (conflict.ancode == ancode) {
				return conflict.numberOfStuds;
			}
		}
		return 0;
	}
	const showConflictCount = $derived(conflictingAncodes.includes(exam.ancode));
	const conflictCount = $derived(showConflictCount ? calcConflictCount(selectedExam) : 0);

	// Karten-Zustand → farbiger Links-Akzent (border-l) + dezente Tönung, auf
	// Theme-Tokens statt hartkodierter Farben. Kaskade wie zuvor (Auswahl > gleiche:r
	// Prüfende:r > sameSlot > Konflikt > extern/nicht-von-mir > Wiederholung > normal).
	const colors = $derived.by(() => {
		if (selectedExam == exam.ancode) return 'border-l-primary bg-primary/15 ring-1 ring-primary/60';
		if (selectedExamerID == exam.zpaExam.mainExamerID) return 'border-l-info bg-info/10';
		if (sameSlot) return 'border-l-accent bg-accent/15';
		if (conflictingAncodes.includes(exam.ancode) && !onlyConflicts)
			return 'border-l-error bg-error/15';
		// von anderer FK geplant (MUC.DAI oder ZPA notPlannedByMe) → grau, read-only-Anmutung
		if (exam.constraints && exam.constraints.notPlannedByMe) return 'border-l-base-300 bg-base-200';
		if (exam.zpaExam.isRepeaterExam) return 'border-l-warning bg-warning/10';
		return 'border-l-success/60';
	});

	function select(code: any) {
		if (!selected) {
			dispatch('selected', {
				ancode: code,
				mainExamerID: exam.zpaExam.mainExamerID
			});
		} else {
			dispatch('unselected', {
				ancode: code,
				mainExamerID: exam.zpaExam.mainExamerID
			});
		}
	}

	let extraRooms = 0;
	for (const pExam of exam.primussExams) {
		if (pExam.ntas && pExam.ntas.length > 0) {
		}
	}

	// function bgColorExam(isRepeaterExam) {
	// 	if (exam.studentRegsCount == 0) {
	// 		return ' bg-slate-100';
	// 	}
	// 	if (exam.zpaExam.isRepeaterExam) {
	// 		return ' bg-yellow-100  ';
	// 	} else {
	// 		return '   ';
	// 	}
	// }

	// let slots = allowedSlots.length;
	// let slotsmax = maxSlots;
	// let slotsColor = ' progress-success ';

	// $: {
	// 	slots = allowedSlots.length;
	// 	slotsmax = maxSlots;
	// 	slotsColor = ' progress-success ';
	// 	if (slots < slotsmax / 2) {
	// 		slotsColor = ' progress-warning ';
	// 	}
	// 	if (slots < slotsmax / 4) {
	// 		slotsColor = ' progress-error ';
	// 	}
	// }

	// let regs = examGroupInfo.studentRegs;
	// let regsMax = 200;
	// let regsColor = ' progress-error ';
	// if (regs < regsMax / 2) {
	// 	regsColor = ' progress-warning ';
	// }
	// if (regs < regsMax / 4) {
	// 	regsColor = ' progress-success ';
	// }

	// let conflicts = examGroupInfo.conflicts.length;
	// let conflictsMax = 25;
	// let conflictsColor = ' progress-error ';
	// if (conflicts < conflictsMax / 2) {
	// 	conflictsColor = ' progress-warning ';
	// }
	// if (conflicts < conflictsMax / 4) {
	// 	conflictsColor = ' progress-success ';
	// }

	// function enabledButton(slot) {
	// 	return slot == 'none';
	// }

	// function addToSlot() {
	// 	dispatch('addToSlot', {
	// 		examGroupCode: examGroupCode,
	// 		slot: slotToMove
	// 	});
	// }

	// function rmFromSlot() {
	// 	dispatch('rmFromSlot', {
	// 		examGroupCode: examGroupCode
	// 	});
	// }

	function alertstyle(count: any) {
		if (count < 5) return '';
		else if (count < 15) return 'alert-success';
		else return 'alert-info';
	}

	onMount(() => {
		// allStudentRegs = allStudentRegsExam(exam.primussExams);
		// 	fetchAllowedSlots();
		// 	fetchAwkwardSlots();
	});

	const width = $derived(details || !inSlot ? 'w-96' : 'w-min');

	// FK-Präfix: Fakultät der Prüfung (MUC.DAI, z. B. „FK03"), sonst die planende
	// FK bei „nicht von mir geplant": Fakultät der Prüfung, sonst Constraint-Feld
	// (rein numerisch → „FK"-Präfix). Leer ⇒ eigene Prüfung (FK07). Logik in
	// $lib/exam/fk (unit-getestet).
	const notMeFk = planningFk(exam.zpaExam.faculty, exam.constraints?.notPlannedByMeInFK);

	// Externe/fremd-geplante Prüfungen über FK + Primuss-Ancode darstellen, z. B.
	// „FK03: 123" bzw. „FK10: 456" — statt Ancode-Präfix-Parsing.
	let ancodeToShow = displayAncode(
		notMeFk,
		exam.zpaExam.primussAncodes?.[0]?.ancode,
		exam.zpaExam.ancode
	);
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade
		class="m-1 cursor-pointer rounded-lg border border-base-300 border-l-4 bg-base-100 p-2 shadow-sm transition-shadow hover:shadow-md {colors} {width}"
		onclick={() => select(exam.ancode)}
	>
		{#if showConflictCount}
			<div class="mb-1">
				<span
					class="badge badge-sm gap-1 {conflictCount >= 15
						? 'badge-info'
						: conflictCount >= 5
							? 'badge-success'
							: 'badge-ghost'}"
				>
					⚠️ {conflictCount}
					{#if details || !inSlot}{conflictCount == 1 ? 'Konflikt' : 'Konflikte'}{/if}
				</span>
			</div>
		{/if}

		{#if !details && inSlot}
			<!-- kompakt: Ancode + Icons + Anmeldezahl; Details im Tooltip -->
			<Tooltip
				content="{exam.zpaExam.module} ({exam.zpaExam.mainExamer}) &sum; {exam.studentRegsCount}"
			>
				<div class="flex items-center gap-1 whitespace-nowrap">
					{#if exam.zpaExam.isRepeaterExam}<span title="Wiederholungsprüfung">🔁</span>{/if}
					{#if exam.planEntry != null && exam.planEntry.locked}<span title="manuell gesperrt"
							>🔒</span
						>{/if}
					{#if exam.planEntry != null && exam.planEntry.phaseFixed}<span
							title="automatisch fixiert (EXaHM/SEB-Raumphase)">🏗️</span
						>{/if}
					<span class="font-mono font-semibold">{ancodeToShow}</span>
					<span class="text-xs tabular-nums text-base-content/50">&sum;{exam.studentRegsCount}</span
					>
				</div>
			</Tooltip>
		{:else}
			{#if exam.planEntry && exam.planEntry.externalTime != null}
				<div class="badge badge-ghost badge-sm mb-1 tabular-nums">
					{mkStarttime(exam.planEntry.externalTime)}
				</div>
			{/if}
			<div class="flex items-start gap-2">
				<div class="flex shrink-0 gap-0.5">
					{#if exam.planEntry != null && exam.planEntry.locked}<span title="manuell gesperrt"
							>🔒</span
						>{/if}
					{#if exam.planEntry != null && exam.planEntry.phaseFixed}<span
							title="automatisch fixiert (EXaHM/SEB-Raumphase)">🏗️</span
						>{/if}
					{#if exam.zpaExam.isRepeaterExam}<span title="Wiederholungsprüfung">🔁</span>{/if}
				</div>
				<div class="min-w-0 grow">
					<div class="font-medium">
						<span class="font-mono">{ancodeToShow}</span> · {exam.zpaExam.module}
					</div>
					<div class="text-xs text-base-content/60">{exam.zpaExam.mainExamer}</div>
				</div>
				<div class="flex shrink-0 flex-col items-end gap-1">
					{#if exam.primussExams.length > 0}
						<span class="badge badge-outline badge-sm tabular-nums" title="Anmeldungen">
							&sum; {exam.studentRegsCount}
						</span>
						<span class="badge badge-outline badge-sm tabular-nums" title="Dauer">
							⏱️ {exam.zpaExam.duration}
						</span>
						{#if exam.maxDuration > exam.zpaExam.duration}
							<span class="badge badge-outline badge-sm tabular-nums" title="max. Dauer (NTA)">
								⏳ {exam.maxDuration}
							</span>
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		{#if details || !inSlot}
			<div class="mt-1 flex flex-wrap items-center gap-1">
				{#each exam.primussExams as primussExam}
					{#if primussExam.exam.ancode != exam.ancode}
						<span class="badge badge-ghost badge-sm"
							>{primussExam.exam.program}/{primussExam.exam.ancode}</span
						>
					{/if}
				{/each}
			</div>

			<a class="mt-1 flex flex-wrap items-center gap-1" href="/examWithRegs/{exam.zpaExam.ancode}">
				{#each exam.primussExams as primussExam}
					{#if primussExam.studentRegs.length > 0}
						<span class="badge badge-outline badge-sm gap-1">
							{primussExam.exam.program}
							{primussExam.studentRegs.length}
						</span>
					{/if}
				{/each}
				{#each exam.zpaExam.groups as g}
					<span class="badge badge-sm">{g}</span>
				{/each}
			</a>

			<div class="mt-1 flex flex-wrap gap-1">
				{#if exam.constraints && exam.constraints.online}
					<span class="badge badge-info badge-sm">online</span>
				{/if}
				{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahm}
					<span class="badge badge-error badge-sm">EXaHM</span>
				{/if}
				{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
					<span class="badge badge-error badge-sm">SEB</span>
				{/if}
				{#if exam.constraints != null && exam.constraints.sameSlot != null && exam.constraints.sameSlot.length > 0}
					<span class="badge badge-warning badge-sm">sameSlot</span>
				{/if}
				{#if exam.constraints && exam.constraints.notPlannedByMe}
					<span class="badge badge-outline badge-sm">
						nicht von mir geplant{notMeFk ? ` · ${notMeFk}` : ''}
					</span>
				{/if}
			</div>
		{/if}
	</div>
{/if}
