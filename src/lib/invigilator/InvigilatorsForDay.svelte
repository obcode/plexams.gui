<script>
	export let day;
	import InvigilatorForDay from '$lib/invigilator/InvigilatorForDay.svelte';
	import { onMount } from 'svelte';

	let want = [];
	let can = [];

	async function fetchInviglatorsForDay(day) {
		const response = await fetch('/api/plan/invigilatorsForDay', {
			method: 'POST',
			body: JSON.stringify({ day }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		// console.log(data);
		want = data.invigilatorsForDay.want;
		can = data.invigilatorsForDay.can.sort(function (invig1, invig2) {
			return (
				invig2.todos.totalMinutes -
				invig2.todos.doingMinutes -
				(invig1.todos.totalMinutes - invig1.todos.doingMinutes)
			);
		});
	}

	onMount(() => {
		fetchInviglatorsForDay(day);
	});
</script>

<div
	class="grid grid-cols-1 border-solid border-2 border-black bg-cyan-400 m-2 p-2 rounded-lg shadow-xl text-center"
>
	<div>Verfügbare Aufsichten</div>
	<div
		class=" w-full border-solid border-2 border-black bg-green-300 mb-2 p-8 rounded-lg shadow-xl text-center"
	>
		<ul>
			{#each want as invigilator}
				<li>
					<InvigilatorForDay {invigilator} />
				</li>
			{/each}
		</ul>
	</div>
	<div
		class=" w-full border-solid border-2 border-black bg-yellow-300 p-8 rounded-lg shadow-xl text-center"
	>
		<ul>
			{#each can as invigilator}
				<li>
					<InvigilatorForDay {invigilator} />
				</li>
			{/each}
		</ul>
	</div>
</div>
