<script>
	export let day;
	export let time;
	export let forbiddenSlot;
	export let exahmrooms;
	export let maxSlots;
	export let selectedExam;
	export let selectedExamerID;
	export let onlyPlannedByMe;
	export let onlyConflicts;
	export let details;
	export let moveable;
	export let showExam;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let showOnlySEB;
	export let showOnlyEXaHMRooms;
	export let conflictingAncodes;
	export let refresh;
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import { onMount } from 'svelte';
	import { mkDateShort } from '$lib/jshelper/misc';

	import SlotExam from '$lib/examsInPlan/SlotExam.svelte';

	let exams = [];

	async function fetchExams() {
		const response = await fetch('/api/examsInSlot', {
			method: 'POST',
			body: JSON.stringify({ day: day.number, time: time.number }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		exams = data.examsInSlot;
		countIt();
		// calculateConflicts();
	}

	let exahm = exahmrooms;

	let conflicts = 0;

	// function calculateConflicts(groupCode, examGroups) {
	// 	conflicts = 0;
	// 	if (examGroups) {
	// 		for (const group of examGroups) {
	// 			for (const conflict of group.examGroupInfo.conflicts) {
	// 				if (conflict.examGroupCode == groupCode) {
	// 					conflicts += conflict.count;
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	// $: calculateConflicts(selectedExam, exams);

	let count = 0;

	function countIt() {
		let counted = 0;
		for (const exam of exams) {
			if (!exam.constraints || (exam.constraints && !exam.constraints.notPlannedByMe)) {
				counted += exam.studentRegsCount;
			}
		}
		count = counted;
	}

	function badgeColor(count) {
		if (count < 50) {
			return 'badge-success';
		}
		if (count < 100) {
			return 'badge-warning';
		}
		return 'badge-error';
	}

	onMount(() => {
		fetchExams();
	});

	function forwardSelected(event) {
		dispatch('selected', event.detail);
	}
	function forwardUnselected(event) {
		dispatch('unselected', event.detail);
	}
	function forwardAddToSlot(event) {
		dispatch('addToSlot', {
			examGroupCode: event.detail.examGroupCode,
			slot: event.detail.slot,
			oldslot: { dayNumber: day, slotNumber: time }
		});
	}
	function forwardRmFromSlot(event) {
		dispatch('rmFromSlot', {
			examGroupCode: event.detail.examGroupCode,
			slot: { dayNumber: day, slotNumber: time }
		});
	}

	$: if (refresh) {
		fetchExams();
		refresh = false;
	}
</script>

<div class="flex justify-between">
	{#if !forbiddenSlot}
		<div class="badge gap-2 m-1">{mkDateShort(day.date)}, {time.start}</div>
	{/if}
	{#if exams.length > 0}
		{#if conflicts > 0}
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
					<span>{conflicts} Konflikte</span>
				</div>
			</div>
		{/if}
		<div class="flex justify-end">
			{#if count > 0}
				<div class="badge {badgeColor(count)} gap-2 m-1 rounded-lg border-black">{count}</div>
			{/if}
		</div>
	{/if}
</div>
{#if showOnlyEXaHMRooms}
	<div>
		{#each exahm as room}
			<div class="badge badge-warning m-1 rounded-lg border-black">{room.name}</div>
		{/each}
	</div>
{/if}

{#each exams as exam}
	<SlotExam
		{exam}
		{maxSlots}
		{showExam}
		{showAncode}
		{showExamerID}
		{showOnlyOnline}
		{showOnlyExahm}
		{showOnlySEB}
		{selectedExam}
		{selectedExamerID}
		{onlyPlannedByMe}
		{onlyConflicts}
		{details}
		{moveable}
		inSlot={true}
		{conflictingAncodes}
		on:selected={forwardSelected}
		on:unselected={forwardUnselected}
		on:addToSlot={forwardAddToSlot}
		on:rmFromSlot={forwardRmFromSlot}
	/>
{/each}
