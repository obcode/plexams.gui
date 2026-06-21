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
				ancode: exam.ancode
			});
		}
	});

	$: if (selected) {
		dispatch('selected', {
			ancode: exam.ancode
		});
	} else {
		dispatch('unselected', {
			ancode: exam.ancode
		});
	}
</script>

<label
	class="flex cursor-pointer flex-col gap-1 rounded-lg border bg-base-100 p-3 transition-colors {selected
		? 'border-primary bg-primary/5'
		: 'border-base-300 hover:border-base-content/30'}"
	transition:fade
>
	<div class="flex items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			<input type="checkbox" bind:checked={selected} class="checkbox checkbox-sm" />
			<span class="font-semibold tabular-nums">{exam.ancode}</span>
		</div>
		<span class="badge badge-ghost badge-sm">{exam.groups}</span>
	</div>
	<div class="text-sm font-medium">{exam.module}</div>
	<div class="text-xs text-base-content/60">{exam.mainExamer}</div>
</label>
