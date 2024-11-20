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
		selected = selectedExam == exam.ancode;
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
		if (selected) {
			colors = 'bg-cyan-700 border-cyan-900 text-white';
		} else if (sameSlot) {
			colors = 'bg-cyan-500 border-cyan-900 text-white';
		} else if (conflictingAncodes.includes(exam.ancode) && !onlyConflicts) {
			colors = 'bg-red-700 border-red-900 text-white';
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
				ancode: code
			});
		} else {
			dispatch('unselected', {
				ancode: code
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
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		transition:fade
		class="shadow-lg m-1 p-2 border-2 rounded-lg {colors} shadow-slate-300 w-96"
		on:click={select(exam.ancode)}
	>
		<!-- <div> -->
		{#if showConflictCount}
			<div class="alert {alertstyle(conflictCount)} shadow-lg p-1 mb-1 w-full">
				<div class="flex justify-between">
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
					<span
						>{conflictCount}
						{#if conflictCount == 1}Konflikt{:else}Konflikte{/if}</span
					>
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
		<div class="flex">
			<div class="flex-none">
				<div class="flex">
					<div>
						{#if exam.planEntry != null && exam.planEntry.locked}
							<div class="mt-2 mr-3">
								<svg
									width="20pt"
									height="20pt"
									version="1.1"
									viewBox="0 0 100 100"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="m50 5c-13.828 0-25 11.391-25 25.406v12.594c-6.043 0-11 4.957-11 11v30c0 6.043 4.957 11 11 11h50c6.043 0 11-4.957 11-11v-30c0-6.043-4.957-11-11-11v-12.594c0-14.016-11.172-25.406-25-25.406zm0 6c10.547 0 19 8.5469 19 19.406v12.594h-38v-12.594c0-10.859 8.4531-19.406 19-19.406zm-25 38h50c2.8203 0 5 2.1797 5 5v30c0 2.8203-2.1797 5-5 5h-50c-2.8203 0-5-2.1797-5-5v-30c0-2.8203 2.1797-5 5-5zm25 5c-5.4883 0-10 4.5117-10 10 0 2.6367 1.4023 4.5938 3 6.125v6.875c0 3.8242 3.1758 7 7 7s7-3.1758 7-7v-6.875c1.5977-1.5312 3-3.4883 3-6.125 0-5.4883-4.5117-10-10-10zm0 6c2.2461 0 4 1.7539 4 4 0 1.3945-0.22266 1.4922-1.7188 2.5312-0.78906 0.55078-1.2852 1.5039-1.2812 2.4688v8c0 0.60547-0.39453 1-1 1s-1-0.39453-1-1v-8c0.003906-0.96484-0.49219-1.918-1.2812-2.4688-1.4961-1.0391-1.7188-1.1367-1.7188-2.5312 0-2.2461 1.7539-4 4-4z"
									/>
								</svg>
							</div>
						{/if}
						{#if exam.zpaExam.isRepeaterExam}
							<div class="mt-2 mr-3">
								<svg
									width="20pt"
									height="20pt"
									version="1.1"
									viewBox="0 0 100 100"
									xmlns="http://www.w3.org/2000/svg"
								>
									<g>
										<path
											d="m83.602 16.398c-9-9-20.898-13.898-33.602-13.898-12.699 0-24.602 4.8984-33.602 13.898s-13.898 20.898-13.898 33.602c0 12.699 4.8984 24.602 13.898 33.602s20.898 13.898 33.602 13.898c12.699 0 24.602-4.8984 33.602-13.898l1.8008-1.8008 0.10156 7.6992c0 2.1016 1.8008 3.8984 3.8984 3.8984h0.10156c2.1992 0 3.8984-1.8008 3.8984-4l-0.30078-17c0-2.1016-1.6992-3.8008-3.8984-3.8984l-17-0.30078c-2.1992 0-3.8984 1.6992-4 3.8984 0 2.1992 1.6992 3.8984 3.8984 4l7.6992 0.10156-1.8008 1.8008c-7.5 7.5-17.398 11.602-28 11.602s-20.602-4.1016-28-11.602-11.699-17.398-11.699-28 4.1992-20.602 11.699-28 17.5-11.602 28-11.602 20.5 4.1016 28 11.602c8.5 8.5 12.602 20.199 11.398 32.199-0.19922 2.1992 1.3008 4.1016 3.5 4.3008 2.1992 0.19922 4.1016-1.3008 4.3008-3.5 1.5-14.398-3.3984-28.398-13.598-38.602z"
										/>
										<path
											d="m38.102 35.602v28.898c0 2.8984 3.1992 4.6992 5.6016 3.1992l23.5-14.398c2.3984-1.3984 2.3984-4.8984 0-6.3008l-23.504-14.602c-2.5-1.5-5.5977 0.30078-5.5977 3.2031z"
										/>
									</g>
								</svg>
							</div>
						{/if}
					</div>
				</div>
				<br />
			</div>
			<div class="grow">
				{exam.zpaExam.ancode}.
				{exam.zpaExam.module}
				({exam.zpaExam.mainExamer})
			</div>
			<div class="min-w-fit flex flex-col place-items-end">
				{#if exam.primussExams.length > 0}
					<div class="badge badge-outline min-w-fit">
						&sum; {exam.studentRegsCount}
					</div>
					<div class="badge badge-outline min-w-fit my-1">
						<svg
							width="14pt"
							height="14pt"
							version="1.1"
							viewBox="0 0 100 100"
							xmlns="http://www.w3.org/2000/svg"
						>
							<g>
								<path
									d="m50 18.41c-1.6211 0-2.9414 1.3203-2.9414 2.9414v27.43l-9.0234 9.0234c-0.55469 0.55469-0.85938 1.293-0.85938 2.0781 0 0.78125 0.30469 1.5234 0.86328 2.082 0.53906 0.53516 1.293 0.83984 2.0781 0.83984 0.78516 0 1.5391-0.30859 2.0781-0.84375l9.8867-9.8828c0.55469-0.55469 0.86328-1.2969 0.86328-2.082v-28.645c-0.003906-1.6211-1.3242-2.9414-2.9453-2.9414zm0.28516 31.59c0 0.082031-0.027344 0.14844-0.082031 0.20312l-9.8828 9.8828c-0.046874 0.046874-0.35547 0.050781-0.41016-0.003907-0.054687-0.054687-0.082031-0.12109-0.082031-0.19922 0-0.078124 0.027344-0.14844 0.085937-0.20312l9.4141-9.4141c0.25-0.25391 0.38672-0.58594 0.38672-0.9375v-27.977c0-0.15625 0.12891-0.28516 0.28516-0.28516s0.28516 0.12891 0.28516 0.28516z"
								/>
								<path
									d="m50 11.289c-21.348 0-38.711 17.367-38.711 38.711 0 21.348 17.363 38.711 38.711 38.711s38.711-17.363 38.711-38.711-17.363-38.711-38.711-38.711zm0 74.766c-19.883 0-36.059-16.176-36.059-36.055 0-19.883 16.176-36.059 36.059-36.059s36.055 16.176 36.055 36.059-16.172 36.055-36.055 36.055z"
								/>
							</g>
						</svg>
						{exam.zpaExam.duration}
					</div>
					{#if exam.maxDuration > exam.zpaExam.duration}
						<div class="badge badge-outline min-w-fit">
							<svg
								width="14pt"
								height="14pt"
								version="1.1"
								viewBox="0 0 100 100"
								xmlns="http://www.w3.org/2000/svg"
							>
								<g>
									<path
										d="m50 20.547c-0.44531 0-0.80859 0.36328-0.80859 0.80859v27.977c0 0.21484-0.085937 0.41797-0.23828 0.57031l-9.4141 9.4102c-0.15234 0.15625-0.23828 0.35547-0.23828 0.57031 0 0.21484 0.082031 0.41797 0.23828 0.57031 0.27734 0.27734 0.85938 0.28125 1.1406 0l9.8828-9.8828c0.15234-0.15625 0.23828-0.35156 0.23828-0.57031l0.003907-28.648c0-0.44531-0.35938-0.80469-0.80469-0.80469z"
									/>
									<path
										d="m50 11.809c-21.059 0-38.191 17.133-38.191 38.191s17.133 38.191 38.191 38.191 38.191-17.133 38.191-38.191-17.133-38.191-38.191-38.191zm2.4219 38.191c0 0.64844-0.25391 1.2539-0.71094 1.7109l-9.8867 9.8828c-0.44141 0.44141-1.0664 0.69141-1.7109 0.69141-0.64844 0-1.2695-0.25-1.7109-0.69141-0.45703-0.46094-0.71094-1.0703-0.71094-1.7148 0-0.64453 0.25391-1.2539 0.70703-1.7109l9.1758-9.1758 0.003906-27.641c0-1.3359 1.0859-2.4219 2.4219-2.4219s2.4219 1.0859 2.4219 2.4219z"
									/>
								</g>
							</svg>
							{exam.maxDuration}
						</div>
					{/if}
				{/if}
			</div>
		</div>

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
		</a>

		{#if exam.constraints && exam.constraints.online}
			<div class="badge badge-error">online</div>
		{/if}
		{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahm}
			<div class="badge badge-error">EXaHM</div>
		{/if}
		{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
			<div class="badge badge-error">S.E.B.</div>
		{/if}
		{#if exam.constraints != null && exam.constraints.sameSlot != null && exam.constraints.sameSlot.length > 0}
			<div class="badge badge-warning">sameSlot</div>
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
