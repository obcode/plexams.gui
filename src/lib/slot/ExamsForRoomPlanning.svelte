<script lang="ts">
	import ExamWithNTAsForRoomPlanning from '$lib/exam/ExamWithNTAsForRoomPlanning.svelte';
	import { onMount } from 'svelte';

	let {
		day,
		time,
		showOnlyExamsWithNTAs,
		details,
		showRooms,
		dimOthers = false,
		showOnlyWithoutRoom = false,
		highlightNotPrePlanned = false,
		// fix vorgeplante Platzzahlen je „ancode|raum|mtknr"
		prePlannedSeats = {},
		// Ancodes mit nicht zugeordneten Studierenden
		unplacedAncodes = new Set()
	}: {
		day: number;
		time: number;
		showOnlyExamsWithNTAs: boolean;
		details: boolean;
		showRooms: any;
		dimOthers?: boolean;
		showOnlyWithoutRoom?: boolean;
		highlightNotPrePlanned?: boolean;
		prePlannedSeats?: Record<string, number>;
		unplacedAncodes?: Set<number>;
	} = $props();

	let examsInSlot = $state<any[]>([]);

	async function fetchExamsInSlot() {
		const response = await fetch('/api/slot/examsInSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		examsInSlot = data.examsInSlot;
	}

	onMount(() => {
		fetchExamsInSlot();
	});
</script>

{#each examsInSlot as plannedExam}
	{#if !plannedExam.constraints || !plannedExam.constraints.notPlannedByMe}
		<ExamWithNTAsForRoomPlanning
			{plannedExam}
			{showOnlyExamsWithNTAs}
			{details}
			{showRooms}
			{dimOthers}
			{day}
			{time}
			{showOnlyWithoutRoom}
			{highlightNotPrePlanned}
			{prePlannedSeats}
			{unplacedAncodes}
		/>
	{/if}
{/each}
