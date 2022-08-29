<script>
	import ExamCard from './ExamCard.svelte';
	export let zpaExamsType;
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let selected = false;

	if (zpaExamsType.type.includes('schriftlich')) {
		selected = true;
	}

	const selectedAncodes = new Set([]);
	let size = selectedAncodes.size;

	function handleSelect(event) {
		selectedAncodes.add(event.detail.anCode);
		size = selectedAncodes.size;
		dispatch('selected', {
			anCode: event.detail.anCode
		});
	}
	function handleUnselect(event) {
		selectedAncodes.delete(event.detail.anCode);
		size = selectedAncodes.size;
		dispatch('unselected', {
			anCode: event.detail.anCode
		});
	}
	let color;
	$: if (size > 0) {
		color = 'text-green-700';
	} else {
		color = 'text-gray-500';
	}
</script>

<div tabindex="0" class="collapse border border-base-300 bg-base-100 rounded-box">
	<input type="checkbox" />
	<div class="collapse-title text-xl font-medium {color}">
		{zpaExamsType.type} ({size}/{zpaExamsType.exams.length})
	</div>
	<div class="collapse-content">
		<input type="checkbox" bind:checked={selected} class="checkbox mr-2" /> Alle auswählen.
		<div class="py-4 grid gap-4 md:grid-cols-6 grid-cols-2">
			{#each zpaExamsType.exams as zpaexam}
				<ExamCard
					exam={zpaexam}
					{selected}
					on:selected={handleSelect}
					on:unselected={handleUnselect}
				/>
			{/each}
		</div>
	</div>
</div>
