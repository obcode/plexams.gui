<script>
	import ExamCard from './ExamCard.svelte';
	export let zpaExamsType;
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let selected = false;

	if (zpaExamsType.type.includes('schriftlich') || zpaExamsType.type.includes('praktisch')) {
		selected = true;
	}

	/** @type {Set<number>} */
	const selectedAncodes = new Set();
	let size = selectedAncodes.size;

	/** @param {any} event */
	function handleSelect(event) {
		selectedAncodes.add(event.detail.ancode);
		size = selectedAncodes.size;
		dispatch('selected', {
			ancode: event.detail.ancode
		});
	}
	/** @param {any} event */
	function handleUnselect(event) {
		selectedAncodes.delete(event.detail.ancode);
		size = selectedAncodes.size;
		dispatch('unselected', {
			ancode: event.detail.ancode
		});
	}
</script>

<div tabindex="-1" class="collapse-arrow collapse rounded-lg border border-base-300 bg-base-100">
	<input type="checkbox" />
	<div class="collapse-title flex items-center gap-2 font-medium">
		<span>{zpaExamsType.type}</span>
		<span class="badge {size > 0 ? 'badge-success' : 'badge-ghost'} badge-sm tabular-nums">
			{size}/{zpaExamsType.exams.length}
		</span>
	</div>
	<div class="collapse-content">
		<label class="label mb-2 w-fit cursor-pointer justify-start gap-2 px-0">
			<input type="checkbox" bind:checked={selected} class="checkbox checkbox-sm" />
			<span class="label-text">Alle auswählen</span>
		</label>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
