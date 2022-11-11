<script>
	export let exam;
	export let selected = false;
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	onMount(() => {
		if (selected) {
			dispatch('selected', {
				anCode: exam.anCode
			});
		}
	});

	$: if (selected) {
		dispatch('selected', {
			anCode: exam.anCode
		});
	} else {
		dispatch('unselected', {
			anCode: exam.anCode
		});
	}
</script>

<div class="card bg-base-100 shadow-xl" transition:fade>
	<div class="card-body">
		<div class="flex justify-between">
			<input type="checkbox" bind:checked={selected} class="checkbox mr-2" />
			<span class="text-red-900">
				{exam.anCode}.
			</span>
			<span class="text-green-900">{exam.groups}</span>
		</div>
		{exam.module}
		<span class="text-blue-900">
			{exam.mainExamer}
		</span>
	</div>
</div>
