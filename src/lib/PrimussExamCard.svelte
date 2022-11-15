<script>
	export let exam;
	export let fk07programs = [];
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let background = '';
	let nonFK07program = '';
	let clicked = false;

	$: if (clicked) {
		background = 'bg-red-500 line-through';
		nonFK07program = '';
		dispatch('removeMe', exam);
	} else {
		background = '';
		if (exam.program && !fk07programs.includes(exam.program)) {
			nonFK07program = 'bg-orange-500';
		}
		dispatch('doNotRemoveMe', exam);
	}

	// if (exam.program && !$fk07programs.includes(exam.program)) {
	// 	nonFK07program = 'bg-orange-500';
	// }
</script>

<div class="card bg-neutral text-neutral-content {nonFK07program} {background} " transition:fade>
	<div class="card-body" on:click={(_) => (clicked = !clicked)}>
		<div class="flex justify-between">
			<span class="text-red-900">
				{exam.ancode}.
			</span>
			{#if exam.groups}
				<span class="text-green-900">{exam.groups}</span>
			{:else}
				<span class="text-green-900">{exam.program}</span>
			{/if}
		</div>
		{exam.module}
		<span class="text-blue-900">
			{exam.mainExamer}
		</span>
	</div>
</div>
