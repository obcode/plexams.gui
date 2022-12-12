<script>
	export let day;
	export let time;
	export let showOnlyExamsWithNTAs;
	export let details;
	import ExamWithNTAsForRoomPlanning from '$lib/exam/ExamWithNTAsForRoomPlanning.svelte';
	import { onMount } from 'svelte';

	let examsInSlot = [];

	async function fetchExamsInSlot() {
		const response = await fetch('/api/plan/examsInSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		// console.log(data.plannedExamsInSlot);
		examsInSlot = data.examsInSlot;
	}

	onMount(() => {
		fetchExamsInSlot();
	});
</script>

{#each examsInSlot as plannedExam}
	<ExamWithNTAsForRoomPlanning {plannedExam} {showOnlyExamsWithNTAs} {details} />
{/each}
