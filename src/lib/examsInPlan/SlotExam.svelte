<script>
	export let exam;
	export let maxSlots;
	export let showExam;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let showOnlySEB;
	export let selectedExam;
	export let selectedExamerID;
	export let onlyPlannedByMe;
	export let onlyConflicts;
	export let details;
	export let moveable;
	export let inSlot;
	export let conflictingAncodes;
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { mkDateTimeShort } from '$lib/jshelper/misc.js';
	import { mkStarttime } from '$lib/jshelper/misc.js';
	import { onMount } from 'svelte';
	import ExamWithNtAsCard from '$lib/exam/ExamWithNTAsCard.svelte';
	import { Tooltip } from '@svelte-plugins/tooltips';

	const dispatch = createEventDispatcher();

	let allowedSlots = [];
	let locked = false;

	// $: locked = allowedSlots.length == 0;

	async function fetchAllowedSlots() {
		const response = await fetch('/api/allowedSlots', {
			method: 'POST',
			body: JSON.stringify({ ancode: ancode }),
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

	let selected = false;
	let sameSlot = false;

	$: {
		selected = selectedExam == exam.ancode || selectedExamerID == exam.zpaExam.mainExamerID;
		sameSlot =
			exam.constraints != null &&
			exam.constraints.sameSlot != null &&
			exam.constraints.sameSlot.includes(selectedExam);
	}

	let slotToMove = 'none';

	let show = true;

	let online = false;
	online = exam.constraints && exam.constraints.online;

	let exahm = false;
	exahm =
		exam.constraints &&
		exam.constraints.roomConstraints &&
		(exam.constraints.roomConstraints.exahm || exam.constraints.roomConstraints.seb);

	let programs = [];
	for (const primussExam of exam.primussExams) {
		if (primussExam.studentRegs.length > 0) programs.push(primussExam.exam.program);
	}

	$: {
		if (onlyPlannedByMe && exam.constraints != null && exam.constraints.notPlannedByMe) {
			show = false;
		} else if (
			!selected &&
			conflictingAncodes.length > 0 &&
			!conflictingAncodes.includes(exam.ancode) &&
			onlyConflicts
		) {
			show = false;
		} else {
			if (showExam == 'all' || conflictingAncodes.includes(exam.ancode)) {
				show = true;
			} else {
				show = programs.includes(showExam);
			}
			if (showExamerID != 'all') {
				show = show && exam.zpaExam.mainExamerID == showExamerID;
			}
			if (showAncode != '0') {
				show = show && exam.ancode == showAncode;
			}
			if (showOnlyOnline) {
				show = online;
			}
			if (showOnlyExahm) {
				show = exahm;
			}
		}

		// 	fetchAllowedSlots();
		// 	fetchAwkwardSlots();
	}

	let showConflictCount = false;
	let conflictCount = 0;
	function calcConflictCount(ancode) {
		for (const conflict of exam.conflicts) {
			if (conflict.ancode == ancode) {
				return conflict.numberOfStuds;
			}
		}
		return 0;
	}

	$: if (showConflictCount) {
		conflictCount = calcConflictCount(selectedExam);
	} else {
		conflictCount = 0;
	}

	let colors;
	$: {
		if (conflictingAncodes.includes(exam.ancode)) {
			showConflictCount = true;
		} else {
			showConflictCount = false;
		}
		if (selectedExam == exam.ancode) {
			colors = 'bg-cyan-700 border-cyan-900 text-white';
		} else if (selectedExamerID == exam.zpaExam.mainExamerID) {
			colors = 'bg-blue-200 border-blue-900';
		} else if (sameSlot) {
			colors = 'bg-cyan-500 border-cyan-900 text-white';
		} else if (conflictingAncodes.includes(exam.ancode) && !onlyConflicts) {
			colors = 'bg-red-700 border-red-900 text-white';
		} else if (exam.constraints && exam.constraints.notPlannedByMe && exam.ancode > 999) {
			colors = 'bg-cyan-100 border-cyan-300';
		} else if (exam.constraints && exam.constraints.notPlannedByMe) {
			colors = 'bg-red-200 border-red-300';
		} else if (locked) {
			colors = 'bg-grey-100';
		} else if (exam.zpaExam.isRepeaterExam) {
			colors = ' bg-orange-200 border-orange-500';
		} else {
			colors = ' bg-green-200 border-green-500';
		}
	}

	function select(code) {
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

	function alertstyle(count) {
		if (count < 5) return '';
		else if (count < 15) return 'alert-success';
		else return 'alert-info';
	}

	onMount(() => {
		// allStudentRegs = allStudentRegsExam(exam.primussExams);
		// 	fetchAllowedSlots();
		// 	fetchAwkwardSlots();
	});

	let width = 'w-96';

	$: if (details || !inSlot) {
		width = 'w-96';
	} else {
		width = 'w-min';
	}

	let ancodeToShow = exam.zpaExam.ancode.toString();
	if (exam.zpaExam.ancode >= 1000) {
		ancodeToShow = ancodeToShow.replace('0', ': ').replace('', 'FK');
		if (exam.zpaExam.ancode < 100000) {
			ancodeToShow = ancodeToShow.replace('FK', 'FK0');
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		transition:fade
		class="shadow-lg m-1 p-2 border-2 rounded-lg {colors} shadow-slate-300 {width}"
		on:click={select(exam.ancode)}
	>
		<!-- <div> -->
		{#if showConflictCount}
			<div class="alert {alertstyle(conflictCount)} shadow-lg p-1 mb-1 w-full">
				<div class="flex justify-between">
					<span class="text-xl">⚠️</span>
					<span
						>{conflictCount}
						{#if details || !inSlot}
							{#if conflictCount == 1}Konflikt{:else}Konflikte{/if}
						{/if}
					</span>
				</div>
			</div>
		{/if}
		<!-- <div class="flex justify-between">
				<a href="/examGroups/{examGroupCode}">
					<div class="border border-gray-400 rounded-lg p-1 mx-2">
						<div>#{examGroupCode} / {examGroupInfo.maxDuration}Min.</div>
					</div>
				</a>
				{#if online}
					<div class="badge badge-error">online</div>
				{/if}
				{#if exahm}
					<div class="badge badge-error">EXaHM</div>
				{/if}
				{#if seb}
					<div class="badge badge-error">S.E.B.</div>
				{/if}
				<div
					class="border border-gray-400 rounded-lg p-1 mx-2"
					on:click={select(examGroupCode)}
				>
					{examGroupInfo.programs} /
					{examGroupInfo.studentRegs}
				</div>
			</div>
			{#if details}
				<div class="flex justify-between m-2">
					<div>{regs} Regs</div>
					<div class="w-1/2">
						<progress class="progress {regsColor} w-full" value={regs} max={regsMax} />
					</div>
				</div>
				<div class="flex justify-between m-2" on:click={select(examGroupCode)}>
					<div>{slots} Slots</div>
					<div class="w-1/2">
						<progress class="progress {slotsColor} w-full" value={slots} max={slotsmax} />
					</div>
				</div>
				<div class="flex justify-between m-2" on:click={select(examGroupCode)}>
					<div>{conflicts} Konflikte</div>
					<div class="w-1/2">
						<progress
							class="progress {conflictsColor} w-full"
							value={conflicts}
							max={conflictsMax}
						/>
					</div>
				</div>
			{/if} -->
		{#if !details && inSlot}
			<Tooltip
				content="{exam.zpaExam.module}
					({exam.zpaExam.mainExamer}) &sum; {exam.studentRegsCount}"
			>
				{#if exam.zpaExam.isRepeaterExam}
					<div class="mt-2 mr-3">
						<span title="Wiederholungsprüfung">🔁</span>
					</div>
				{/if}
				{ancodeToShow}
			</Tooltip>
		{:else}
			{#if exam.planEntry && exam.planEntry.externalTime != null}
				<div class="badge bg-white-300">
					{mkStarttime(exam.planEntry.externalTime)}
				</div>
			{/if}
			<div class="flex">
				<div class="flex-none">
					<div class="flex">
						<div>
							{#if exam.planEntry != null && exam.planEntry.locked}
								<div class="mt-2 mr-3">
									<span title="manuell gesperrt">🔒</span>
								</div>
							{/if}
							{#if exam.planEntry != null && exam.planEntry.phaseFixed}
								<div class="mt-2 mr-3">
									<span title="automatisch fixiert (EXaHM/SEB-Raumphase)">🏗️</span>
								</div>
							{/if}
							{#if exam.zpaExam.isRepeaterExam}
								<div class="mt-2 mr-3">
									<span title="Wiederholungsprüfung">🔁</span>
								</div>
							{/if}
						</div>
					</div>
					<br />
				</div>
				<div class="grow">
					{ancodeToShow}.
					{exam.zpaExam.module}
					({exam.zpaExam.mainExamer})
				</div>
				<div class="min-w-fit flex flex-col place-items-end">
					{#if exam.primussExams.length > 0}
						<div class="badge badge-outline min-w-fit">
							&sum; {exam.studentRegsCount}
						</div>
						<div class="badge badge-outline min-w-fit my-1">
							<span title="Dauer">⏱️</span>
							{exam.zpaExam.duration}
						</div>
						{#if exam.maxDuration > exam.zpaExam.duration}
							<div class="badge badge-outline min-w-fit">
								<span title="max. Dauer">⏳</span>
								{exam.maxDuration}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		{#if details || !inSlot}
			<div>
				{#each exam.primussExams as primussExam}
					{#if primussExam.exam.ancode != exam.ancode}
						<div class="badge">{primussExam.exam.program}/{primussExam.exam.ancode}</div>
					{/if}
				{/each}
			</div>

			<a href="/examWithRegs/{exam.zpaExam.ancode}">
				{#each exam.primussExams as primussExam}
					{#if primussExam.studentRegs.length > 0}
						<div class="badge badge-outline gap-2 mx-1">
							{primussExam.exam.program}
							{primussExam.studentRegs.length}
						</div>
					{/if}
				{/each}
				<div class="badge gap-2 mx-1">
					{exam.zpaExam.groups}
				</div>
			</a>

			{#if exam.constraints && exam.constraints.online}
				<div class="badge badge-error">online</div>
			{/if}
			{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahm}
				<div class="badge badge-error rounded-lg border-black">EXaHM</div>
			{/if}
			{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
				<div class="badge badge-error rounded-lg border-black">SEB</div>
			{/if}
			{#if exam.constraints != null && exam.constraints.sameSlot != null && exam.constraints.sameSlot.length > 0}
				<div class="badge badge-warning rounded-lg border-black">sameSlot</div>
			{/if}
		{/if}
	</div>
	<!-- <div>
			{#if moveable || selected}
				{#if exam.constraints && exam.constraints.notPlannedByMe}
					<div class="alert shadow-lg p-1 w-full">
						<div>
							<span class="text-xl">⚠️</span>
							<span>Nicht von mir geplant</span>
						</div>
					</div>
				{:else if allowedSlots.length == 0}
					<div class="alert shadow-lg p-1 w-full">
						<div>
							<span class="text-xl">⚠️</span>
							<span>nicht verschiebbar</span>
						</div>
					</div>
				{:else}
					<div class="border-slate-400 p-1 m-2 border-2 rounded-lg">
						<select
							class="select select-sm select-bordered select-ghost m-2"
							bind:value={slotToMove}
						>
							<option selected value="none">Slot auswählen</option>
							{#each allowedSlots as slot}
								<option value={slot}
									>({slot.dayNumber}, {slot.slotNumber})
									<span class="font-mono"> {mkDateTimeShort(slot.starttime)}</span></option
								>
							{/each}
						</select>
						<div class="flex mx-2">
							<button
								class="btn btn-xs btn-outline"
								disabled={enabledButton(slotToMove)}
								on:click={addToSlot}
							>
								{#if inSlot}
									verschieben
								{:else}
									In Slot einplanen
								{/if}
							</button>
							{#if inSlot}
								<button class="btn-xs btn btn-outline mx-2" on:click={rmFromSlot}>entfernen</button>
							{/if}
						</div>
					</div>
				{/if}
			{/if}
		</div> -->
	<!-- </div> -->
{/if}
