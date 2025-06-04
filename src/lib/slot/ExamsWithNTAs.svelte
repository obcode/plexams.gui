<script>
	export let day;
	export let time;
	export let showOnlyExamsWithNTAs;
	export let details;
	import ExamWithNTAsCard from '$lib/exam/ExamWithNTAsCard.svelte';
	import { onMount } from 'svelte';

	let examsWithNTAs = [];

	async function fetchExamsWithNTAs() {
		const response = await fetch('/api/plan/slotWithNTAs', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		examsWithNTAs = data.plannedExamsInSlot;
	}

	onMount(() => {
		fetchExamsWithNTAs();
	});
</script>

{#each examsWithNTAs as plannedExam}
	<ExamWithNTAsCard {plannedExam} {showOnlyExamsWithNTAs} {details} />
{/each}
