<script>
	export let day;
	export let time;
	import { onMount } from 'svelte';
	import { each, group_outros } from 'svelte/internal';

	let examGroups = [];

	async function fetchExamGroups() {
		const response = await fetch('/api/examGroupsInSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		examGroups = data.examGroupsInSlot;
	}

	onMount(() => fetchExamGroups());
</script>

{#each examGroups as group}
	<div class="shadow-lg m-1 p-1 bg-yellow-200 0 border border-red-10">
		<ul>
			{#each group.exams as exam}
				<li>
					{exam.exam.zpaExam.ancode}.
					{exam.exam.zpaExam.mainExamer}
					{exam.exam.zpaExam.module}
				</li>
			{/each}
		</ul>
	</div>
{/each}
