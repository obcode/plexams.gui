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
					<span class="text-xl">⚠️</span>
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
