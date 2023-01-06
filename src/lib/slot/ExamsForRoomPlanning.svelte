<script>
	export let day;
	export let time;
	export let showOnlyExamsWithNTAs;
	export let details;
	export let showRooms;
	import ExamWithNTAsForRoomPlanning from '$lib/exam/ExamWithNTAsForRoomPlanning.svelte';
	import { onMount } from 'svelte';

	let examsInSlotWithRooms = [];

	async function fetchExamsInSlot() {
		const response = await fetch('/api/plan/examsInSlotWithRooms', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		// console.log(data.plannedExamsInSlot);
		examsInSlotWithRooms = data.examsInSlotWithRooms;
	}

	onMount(() => {
		fetchExamsInSlot();
	});
</script>

{#each examsInSlotWithRooms as plannedExam}
	<ExamWithNTAsForRoomPlanning {plannedExam} {showOnlyExamsWithNTAs} {details} {showRooms} />
{/each}
