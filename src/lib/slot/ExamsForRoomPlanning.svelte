<script>
	/** @type {number} */
	export let day;
	/** @type {number} */
	export let time;
	export let showOnlyExamsWithNTAs;
	export let details;
	export let showRooms;
	export let dimOthers = false;
	/** für den Raum-Picker (Vorplanung): alle aktiven Räume @type {any[]} */
	export let rooms = [];
	export let showOnlyWithoutRoom = false;
	import ExamWithNTAsForRoomPlanning from '$lib/exam/ExamWithNTAsForRoomPlanning.svelte';
	import { onMount } from 'svelte';

	/** @type {any[]} */
	let examsInSlot = [];

	async function fetchExamsInSlot() {
		const response = await fetch('/api/examsInSlot', {
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
			{rooms}
			{showOnlyWithoutRoom}
		/>
	{/if}
{/each}
