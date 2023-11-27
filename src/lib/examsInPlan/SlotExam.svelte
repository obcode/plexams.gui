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
	export let details;
	export let moveable;
	export let inSlot;
	export let conflictingAncodes;
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { mkDateTimeShort } from '$lib/jshelper/misc.js';
	import { onMount } from 'svelte';
	import ExamWithNtAsCard from '$lib/exam/ExamWithNTAsCard.svelte';

	const dispatch = createEventDispatcher();

	let allowedSlots = [];
	let locked = false;

	// $: locked = allowedSlots.length == 0;

	// async function fetchAllowedSlots() {
	// 	const response = await fetch('/api/allowedSlots', {
	// 		method: 'POST',
	// 		body: JSON.stringify({ examGroupCode: examGroupCode }),
	// 		headers: {
	// 			'content-type': 'application/json'
	// 		}
	// 	});
	// 	let data = await response.json();
	// 	allowedSlots = data.allowedSlots;
	// }

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

	$: selected = selectedExam == exam.ancode;

	let slotToMove = 'none';

	let show = true;

	let online = false;
	online = online || (exam.constraints && exam.constraints.online);

	let exahm = false;
	exahm =
		exahm ||
		(exam.constraints &&
			exam.constraints.roomConstraints &&
			exam.constraints.roomConstraints.exahmRooms);

	let seb = false;
	seb =
		seb ||
		(exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb);

	let programs = [];
	for (const primussExam of exam.primussExams) {
		if (primussExam.studentRegs.length > 0) programs.push(primussExam.exam.program);
	}

	$: {
		if (showExam == 'all') {
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
		if (showOnlySEB) {
			show = seb;
		}

		// 	fetchAllowedSlots();
		// 	fetchAwkwardSlots();
	}

	let showConflictCount = false;
	// function conflictCount(examCode) {
	// 	for (const conflict of examGroupInfo.conflicts) {
	// 		if (conflict.examGroupCode == examCode) {
	// 			return conflict.count;
	// 		}
	// 	}
	// 	return 0;
	// }

	let colors;
	$: if (selected) {
		colors = 'bg-cyan-700 border-cyan-900 text-white';
		showConflictCount = false;
	} else {
		if (conflictingAncodes.includes(exam.ancode)) {
			colors = 'bg-red-700 border-red-900 text-white';
			showConflictCount = true;
		} else {
			if (exam.constraints && exam.constraints.notPlannedByMe) {
				colors = 'bg-red-200 border-red-300';
			} else {
				if (locked) {
					colors = 'bg-grey-100';
				} else {
					if (exam.zpaExam.isRepeaterExam) {
						colors = ' bg-orange-200 border-orange-500';
					} else {
						colors = ' bg-green-200 border-green-500';
					}
				}
			}
			showConflictCount = false;
		}
	}

	function select(code) {
		if (!selected) {
			dispatch('selected', {
				ancode: code
			});
		} else {
			dispatch('unselected', {
				ancode: code
			});
		}
	}

	function bgColorExam(isRepeaterExam) {
		if (exam.studentRegsCount == 0) {
			return ' bg-slate-100';
		}
		if (exam.zpaExam.isRepeaterExam) {
			return ' bg-yellow-100  ';
		} else {
			return '   ';
		}
	}

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

	onMount(() => {
		// allStudentRegs = allStudentRegsExam(exam.primussExams);
		// 	fetchAllowedSlots();
		// 	fetchAwkwardSlots();
	});
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		transition:fade
		class="shadow-lg m-1 p-2 border-2 rounded-lg {colors} shadow-slate-300"
		on:click={select(exam.ancode)}
	>
		<!-- <div> -->
		<!-- {#if showConflictCount}
				<div class="alert shadow-lg p-1 w-full">
					<div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="stroke-current flex-shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/></svg
						>
						<span>{conflictCount(selectedExam)} Konflikte</span>
					</div>
				</div>
			{/if}
			{#if allowedSlots.length == 0}
				<div class="p-1 m-2">
					<svg
						viewBox="0 0 100 100"
						class="stroke-current flex-shrink-0 h-3 w-3"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="m78.57 28.57v14.285h10.715c1.9727 0 3.5703 1.6016 3.5703 3.5742v50c0 1.9727-1.5977 3.5703-3.5703 3.5703h-78.57c-1.9727 0-3.5703-1.5977-3.5703-3.5703v-50c0-1.9727 1.5977-3.5742 3.5703-3.5742h10.715v-14.285c0-15.777 12.789-28.57 28.57-28.57s28.57 12.793 28.57 28.57zm-14.285 14.285v-14.285c0-7.8867-6.3945-14.285-14.285-14.285s-14.285 6.3984-14.285 14.285v14.285z"
							fill-rule="evenodd"
						/>
					</svg>
				</div>
			{/if} -->
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
		<div class="grid grid-cols-6">
			<div class="col-span-5">
				{exam.zpaExam.ancode}.
				{exam.zpaExam.mainExamer}
				{exam.zpaExam.module}
				<br />
			</div>
			<div class="col-span-1">
				{#if exam.primussExams.length > 0}
					<div class="badge badge-outline gap-2">
						&sum; {exam.studentRegsCount}
					</div>
				{/if}
			</div>
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
		</a>
		{#if exam.constraints && exam.constraints.online}
			<div class="badge badge-error">online</div>
		{/if}
		{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahmRooms}
			<div class="badge badge-error">EXaHM</div>
		{/if}
		{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
			<div class="badge badge-error">S.E.B.</div>
		{/if}
	</div>
	<!-- <div>
			{#if moveable || selected}
				{#if exam.constraints && exam.constraints.notPlannedByMe}
					<div class="alert shadow-lg p-1 w-full">
						<div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="stroke-current flex-shrink-0 h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/></svg
							>
							<span>Nicht von mir geplant</span>
						</div>
					</div>
				{:else if allowedSlots.length == 0}
					<div class="alert shadow-lg p-1 w-full">
						<div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="stroke-current flex-shrink-0 h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/></svg
							>
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
