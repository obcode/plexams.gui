<script>
	export let group;
	export let maxSlots;
	export let showGroup;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let selectedGroup;
	export let details;
	export let moveable;
	export let inSlot;
	export let conflictingGroupCodes;
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { mkDateTimeShort } from '$lib/jshelper/misc.js';
	import { onMount } from 'svelte';
	const dispatch = createEventDispatcher();

	let allowedSlots = [];

	async function fetchAllowedSlots() {
		const response = await fetch('/api/allowedSlots', {
			method: 'POST',
			body: JSON.stringify({ examGroupCode: group.examGroupCode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		allowedSlots = data.allowedSlots;
	}

	let awkwardSlots = [];

	async function fetchAwkwardSlots() {
		const response = await fetch('/api/awkwardSlots', {
			method: 'POST',
			body: JSON.stringify({ examGroupCode: group.examGroupCode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		awkwardSlots = data.awkwardSlots;
	}

	$: selected = selectedGroup == group.examGroupCode;

	let slotToMove = 'none';

	let show = true;

	let online = false;
	for (const exam of group.exams) {
		online = online || (exam.constraints && exam.constraints.online);
	}

	let exahm = false;
	for (const exam of group.exams) {
		exahm =
			exahm ||
			(exam.constraints &&
				exam.constraints.roomConstraints &&
				exam.constraints.roomConstraints.exahmRooms);
	}

	$: {
		if (showGroup == 'all') {
			show = true;
		} else {
			show = group.examGroupInfo.programs.includes(showGroup);
		}
		if (showExamerID != 'all') {
			let showE = false;
			for (const exam of group.exams) {
				showE = showE || exam.exam.zpaExam.mainExamerID == showExamerID;
			}
			show = show && showE;
		}
		if (showAncode != '0') {
			let showA = false;
			for (const exam of group.exams) {
				showA = showA || exam.exam.ancode == showAncode;
			}
			show = show && showA;
		}
		if (showOnlyOnline) {
			show = online;
		}
		if (showOnlyExahm) {
			show = exahm;
		}

		fetchAllowedSlots();
		fetchAwkwardSlots();
	}

	let showConflictCount = false;
	function conflictCount(groupCode) {
		for (const conflict of group.examGroupInfo.conflicts) {
			if (conflict.examGroupCode == groupCode) {
				return conflict.count;
			}
		}
		return 0;
	}

	let bgcolor;
	$: if (selected) {
		bgcolor = 'bg-cyan-500';
		showConflictCount = false;
	} else {
		if (conflictingGroupCodes.includes(group.examGroupCode)) {
			bgcolor = 'bg-red-500';
			showConflictCount = true;
		} else {
			if (group.examGroupInfo.notPlannedByMe) {
				bgcolor = 'bg-red-200';
			} else {
				bgcolor = 'bg-yellow-200';
			}
			showConflictCount = false;
		}
	}

	function select(code) {
		if (!selected) {
			dispatch('selected', {
				examGroupCode: code
			});
		} else {
			dispatch('unselected', {
				examGroupCode: code
			});
		}
	}

	function studentRegsExam(studentRegs) {
		let count = 0;
		for (const studReg of studentRegs) {
			count += studReg.studentRegs.length;
		}
		return count;
	}

	function bgColorExam(isRepeaterExam) {
		if (isRepeaterExam) {
			return ' bg-yellow-100  ';
		} else {
			return '   ';
		}
	}

	let slots = allowedSlots.length;
	let slotsmax = maxSlots;
	let slotsColor = ' progress-success ';

	$: {
		slots = allowedSlots.length;
		slotsmax = maxSlots;
		slotsColor = ' progress-success ';
		if (slots < slotsmax / 2) {
			slotsColor = ' progress-warning ';
		}
		if (slots < slotsmax / 4) {
			slotsColor = ' progress-error ';
		}
	}

	let regs = group.examGroupInfo.studentRegs;
	let regsMax = 200;
	let regsColor = ' progress-error ';
	if (regs < regsMax / 2) {
		regsColor = ' progress-warning ';
	}
	if (regs < regsMax / 4) {
		regsColor = ' progress-success ';
	}

	let conflicts = group.examGroupInfo.conflicts.length;
	let conflictsMax = 25;
	let conflictsColor = ' progress-error ';
	if (conflicts < conflictsMax / 2) {
		conflictsColor = ' progress-warning ';
	}
	if (conflicts < conflictsMax / 4) {
		conflictsColor = ' progress-success ';
	}

	function enabledButton(slot) {
		return slot == 'none';
	}

	function addToSlot() {
		dispatch('addToSlot', {
			examGroupCode: group.examGroupCode,
			slot: slotToMove
		});
	}

	function rmFromSlot() {
		dispatch('rmFromSlot', {
			examGroupCode: group.examGroupCode
		});
	}

	onMount(() => {
		fetchAllowedSlots();
		fetchAwkwardSlots();
	});
</script>

{#if show}
	<div
		transition:fade
		class="flex flex-col justify-between shadow-lg m-1 p-1 {bgcolor}  border-2 border-slate-900 rounded-lg shadow-xl shadow-slate-300"
	>
		<div>
			{#if showConflictCount}
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
						<span>{conflictCount(selectedGroup)} Konflikte</span>
					</div>
				</div>
			{/if}
			{#if allowedSlots.length == 0}
				<div class="p-1 m-2">
					<svg
						viewBox="0 0 100 100"
						class="stroke-current flex-shrink-0 h-6 w-6"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="m78.57 28.57v14.285h10.715c1.9727 0 3.5703 1.6016 3.5703 3.5742v50c0 1.9727-1.5977 3.5703-3.5703 3.5703h-78.57c-1.9727 0-3.5703-1.5977-3.5703-3.5703v-50c0-1.9727 1.5977-3.5742 3.5703-3.5742h10.715v-14.285c0-15.777 12.789-28.57 28.57-28.57s28.57 12.793 28.57 28.57zm-14.285 14.285v-14.285c0-7.8867-6.3945-14.285-14.285-14.285s-14.285 6.3984-14.285 14.285v14.285z"
							fill-rule="evenodd"
						/>
					</svg>
				</div>
			{/if}
			<div class="flex justify-between">
				<a href="/exam/examGroups/{group.examGroupCode}">
					<div class="border border-gray-400 rounded-lg p-1 mx-2">
						<div>#{group.examGroupCode} / {group.examGroupInfo.maxDuration}Min.</div>
					</div>
				</a>
				{#if online}
					<div class="badge badge-error">online</div>
				{/if}

				{#if exahm}
					<div class="badge badge-error">EXaHM</div>
				{/if}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div
					class="border border-gray-400 rounded-lg p-1 mx-2"
					on:click={select(group.examGroupCode)}
				>
					{group.examGroupInfo.programs} /
					{group.examGroupInfo.studentRegs}
				</div>
			</div>
			{#if details}
				<div class="flex justify-between m-2">
					<div>{regs} Regs</div>
					<div class="w-1/2">
						<progress class="progress {regsColor} w-full" value={regs} max={regsMax} />
					</div>
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="flex justify-between m-2" on:click={select(group.examGroupCode)}>
					<div>{slots} Slots</div>
					<div class="w-1/2">
						<progress class="progress {slotsColor} w-full" value={slots} max={slotsmax} />
					</div>
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="flex justify-between m-2" on:click={select(group.examGroupCode)}>
					<div>{conflicts} Konflikte</div>
					<div class="w-1/2">
						<progress
							class="progress {conflictsColor} w-full"
							value={conflicts}
							max={conflictsMax}
						/>
					</div>
				</div>
			{/if}
			<ul class="m-1">
				{#each group.exams as exam}
					<li
						class="border border-gray-400 {bgColorExam(
							exam.exam.zpaExam.isRepeaterExam
						)} rounded m-1 p-1"
					>
						{exam.exam.zpaExam.ancode}.
						{exam.exam.zpaExam.mainExamer}
						{exam.exam.zpaExam.module}
						<a href="/exam/examWithRegs/{exam.exam.zpaExam.ancode}">
							<div class="badge badge-outline gap-2">{studentRegsExam(exam.exam.studentRegs)}</div>
						</a>
						{#if exam.constraints && exam.constraints.online}
							<div class="badge badge-error">online</div>
						{/if}
						{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahmRooms}
							<div class="badge badge-error">EXaHM</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
		<div>
			{#if moveable || selected}
				{#if group.examGroupInfo.notPlannedByMe}
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
							class="select select-sm select-bordered  select-ghost m-2"
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
		</div>
	</div>
{/if}
