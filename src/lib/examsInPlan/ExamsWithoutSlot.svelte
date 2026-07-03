<script lang="ts">
	import SlotExam from '$lib/examsInPlan/SlotExam.svelte';

	import { createEventDispatcher } from 'svelte';
	let {
		examsWithoutSlot,
		maxSlots,
		showExam,
		showAncode,
		showExamerID,
		showOnlyOnline,
		showOnlyExahm,
		showOnlySEB,
		selectedExam,
		selectedExamerID,
		onlyPlannedByMe,
		details,
		moveable,
		conflictingAncodes
	} = $props();
	const dispatch = createEventDispatcher();
	const grouped = $derived.by(() => {
		const result: [any[], any[]] = [[], []];
		for (const element of examsWithoutSlot) {
			result[element.constraints && element.constraints.notPlannedByMe ? 1 : 0].push(element);
		}
		return result;
	});
	const examsPlannedByMe = $derived(grouped[0]);
	const examsNotPlannedByMe = $derived(grouped[1]);

	let showExamsPlannedByMe = $state(true);

	function forwardSelected(event) {
		dispatch('selected', event.detail);
	}
	function forwardUnselected(event) {
		dispatch('unselected', event.detail);
	}
	function forwardAddToSlot(event) {
		dispatch('addToSlot', event.detail);
	}
	function forwardRmFromSlot(event) {
		dispatch('rmFromSlot', event.detail);
	}
</script>

{#if examsPlannedByMe.length > 0}
	<div class="text-center m-2">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="text-4xl text-center mt-8 uppercase"
			onclick={() => (showExamsPlannedByMe = !showExamsPlannedByMe)}
		>
			{examsPlannedByMe.length} Prüfungen noch einzuplanen
		</div>
	</div>
	{#if showExamsPlannedByMe}
		<div class="flex flex-wrap gap-4">
			{#each examsPlannedByMe as exam}
				<SlotExam
					{exam}
					{maxSlots}
					{showExam}
					{showAncode}
					{showExamerID}
					{showOnlyOnline}
					{showOnlyExahm}
					{showOnlySEB}
					{selectedExam}
					{selectedExamerID}
					{onlyPlannedByMe}
					{details}
					{moveable}
					inSlot={false}
					{conflictingAncodes}
					on:selected={forwardSelected}
					on:unselected={forwardUnselected}
					on:addToSlot={forwardAddToSlot}
					on:rmFromSlot={forwardRmFromSlot}
				/>
			{/each}
		</div>
	{/if}
{:else}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">💪 Alles geplant</div>
	</div>
{/if}

{#if !onlyPlannedByMe && examsNotPlannedByMe.length > 0}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">
			{examsNotPlannedByMe.length} Prüfungen nicht durch mich einzuplanen
		</div>
	</div>

	<div class="flex flex-wrap gap-4">
		{#each examsNotPlannedByMe as exam}
			<SlotExam
				{exam}
				{maxSlots}
				{showExam}
				{showAncode}
				{showExamerID}
				{showOnlyOnline}
				{showOnlyExahm}
				{showOnlySEB}
				{selectedExam}
				{selectedExamerID}
				{onlyPlannedByMe}
				{details}
				{moveable}
				inSlot={false}
				{conflictingAncodes}
				on:selected={forwardSelected}
				on:unselected={forwardUnselected}
				on:addToSlot={forwardAddToSlot}
				on:rmFromSlot={forwardRmFromSlot}
			/>
		{/each}
	</div>
{/if}
