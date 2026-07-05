<script lang="ts">
	import { onMount } from 'svelte';
	import { mkDateShort } from '$lib/jshelper/misc';

	import SlotExam from '$lib/examsInPlan/SlotExam.svelte';
	let {
		day,
		time,
		forbiddenSlot,
		exahmrooms,
		maxSlots,
		selectedExam,
		selectedExamerID,
		onlyPlannedByMe,
		onlyConflicts,
		details,
		moveable,
		showExam,
		showAncode,
		showExamerID,
		showOnlyOnline,
		showOnlyExahm,
		showOnlySEB,
		showOnlyEXaHMRooms,
		conflictingAncodes,
		refresh = $bindable(),
		onselected,
		onunselected
	} = $props();

	let exams = $state<any[]>([]);

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
	}

	let exahm = exahmrooms;

	let count = $state(0);

	function countIt() {
		let counted = 0;
		for (const exam of exams) {
			if (!exam.constraints || (exam.constraints && !exam.constraints.notPlannedByMe)) {
				counted += exam.studentRegsCount;
			}
		}
		count = counted;
	}

	function badgeColor(count: any) {
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

	$effect(() => {
		if (refresh) {
			fetchExams();
			refresh = false;
		}
	});
</script>

<div class="flex justify-between">
	{#if !forbiddenSlot}
		<div class="badge gap-2 m-1">{mkDateShort(day.date)}, {time.start}</div>
	{/if}
	{#if exams.length > 0}
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
		{onselected}
		{onunselected}
	/>
{/each}
