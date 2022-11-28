<script>
	export let examGroupsWithoutSlot;
	export let maxSlots;
	export let showGroup;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let selectedGroup;
	export let details;
	export let moveable;
	export let conflictingGroupCodes;

	import SlotExamGroup from '$lib/SlotExamGroup.svelte';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	examGroupsWithoutSlot.sort(
		(g1, g2) => g2.examGroupInfo.studentRegs - g1.examGroupInfo.studentRegs
	);

	function forwardSelected(event) {
		dispatch('selected', event.detail);
	}
	function forwardUnselected(event) {
		dispatch('unselected', event.detail);
	}
	function forwardAddToSlot(event) {
		dispatch('addToSlot', event.detail);
	}
</script>

{#if examGroupsWithoutSlot.length > 0}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">Noch einzuplanen</div>
	</div>

	<div class="grid  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
		{#each examGroupsWithoutSlot as group}
			<SlotExamGroup
				{group}
				{maxSlots}
				{showGroup}
				{showAncode}
				{showExamerID}
				{showOnlyOnline}
				{showOnlyExahm}
				selected={selectedGroup == group.examGroupCode}
				{details}
				{moveable}
				inSlot={false}
				{conflictingGroupCodes}
				on:selected={forwardSelected}
				on:unselected={forwardUnselected}
				on:addToSlot={forwardAddToSlot}
			/>
		{/each}
	</div>
{:else}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">💪 Alles geplant</div>
	</div>
{/if}
