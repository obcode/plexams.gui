<script>
	export let group;
	export let maxSlots;
	export let showGroup;
	export let showAncode;
	export let showExamerID;
	export let selected;
	export let details;
	export let moveable;
	export let inSlot;
	export let conflictingGroupCodes;
	import { createEventDispatcher } from 'svelte';
	import { mkDateTimeShort } from '$lib/jshelper/misc.js';
	const dispatch = createEventDispatcher();

	let slotToMove = 'none';

	let show = true;

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
	}

	let bgcolor;
	$: if (selected) {
		bgcolor = 'bg-cyan-500';
	} else {
		if (conflictingGroupCodes.includes(group.examGroupCode)) {
			bgcolor = 'bg-red-500';
		} else {
			if (group.examGroupInfo.notPlannedByMe) {
				bgcolor = 'bg-red-200';
			} else {
				bgcolor = 'bg-yellow-200';
			}
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

	let slots = group.examGroupInfo.possibleSlots.length;
	let slotsmax = maxSlots;
	let slotsColor = ' progress-success ';
	if (slots < slotsmax / 2) {
		slotsColor = ' progress-warning ';
	}
	if (slots < slotsmax / 4) {
		slotsColor = ' progress-error ';
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
</script>

{#if show}
	<div
		class="shadow-lg m-1 p-1 {bgcolor}  border-2 border-slate-900 rounded-lg shadow-xl shadow-slate-300"
	>
		<div class="flex justify-between">
			<a href="/exam/examGroups/{group.examGroupCode}">
				<div class="badge m-1 badge-outline mx-2">
					<div>#{group.examGroupCode}</div>
				</div>
			</a>
			<div class="badge m-1 badge-outline mx-2">
				{group.examGroupInfo.programs} /
				{group.examGroupInfo.studentRegs}
			</div>
		</div>
		{#if details}
			<div class="flex justify-between m-2" on:click={select(group.examGroupCode)}>
				<div>{slots} Slots</div>
				<div class="w-1/2">
					<progress class="progress {slotsColor} w-full" value={slots} max={slotsmax} />
				</div>
			</div>
			<div class="flex justify-between m-2">
				<div>{regs} Regs</div>
				<div class="w-1/2">
					<progress class="progress {regsColor} w-full" value={regs} max={regsMax} />
				</div>
			</div>
			<div class="flex justify-between m-2">
				<div>{conflicts} Konflikte</div>
				<div class="w-1/2">
					<progress class="progress {conflictsColor} w-full" value={conflicts} max={conflictsMax} />
				</div>
			</div>
		{/if}
		<ul class="m-1">
			{#each group.exams as exam}
				<li class="border border-gray-400 {bgColorExam(exam.exam.zpaExam.isRepeaterExam)}  m-1 p-1">
					{exam.exam.zpaExam.ancode}.
					{exam.exam.zpaExam.mainExamer}
					{exam.exam.zpaExam.module}
					<a href="/exam/examWithRegs/{exam.exam.zpaExam.ancode}">
						<div class="badge gap-2">{studentRegsExam(exam.exam.studentRegs)}</div>
					</a>
				</li>
			{/each}
		</ul>
		{#if !group.examGroupInfo.notPlannedByMe && moveable}
			<div class="border-slate-400 p-1 m-2 border-2 rounded-lg">
				<select class="select select-sm select-bordered  select-ghost m-2" bind:value={slotToMove}>
					<option selected value="none">Slot auswählen</option>
					{#each group.examGroupInfo.possibleSlots as slot}
						<option value={slot}
							>({slot.dayNumber}, {slot.slotNumber})
							<span class="font-mono"> {mkDateTimeShort(slot.starttime)}</span></option
						>
					{/each}
				</select>
				<div class="flex mx-2">
					{#if inSlot}
						<button class="btn btn-xs btn-outline">verschieben</button>
					{:else}
						<button class="btn btn-xs btn-outline">In Slot einplanen</button>
					{/if}
					{#if inSlot}
						<button class="btn-xs btn btn-outline mx-2">entfernen</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
