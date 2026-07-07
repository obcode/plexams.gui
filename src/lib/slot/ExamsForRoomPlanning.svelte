<script lang="ts">
	import ExamWithNTAsForRoomPlanning from '$lib/exam/ExamWithNTAsForRoomPlanning.svelte';
	import { onMount } from 'svelte';

	let {
		day,
		time,
		starttime,
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
		starttime: string;
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
		const response = await fetch('/api/slot/examsAt', {
			method: 'POST',
			body: JSON.stringify({ starttime }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		examsInSlot = data.examsAt;
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
			{starttime}
			{showOnlyWithoutRoom}
			{highlightNotPrePlanned}
			{prePlannedSeats}
			{unplacedAncodes}
		/>
	{/if}
{/each}
