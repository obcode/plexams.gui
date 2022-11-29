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

	import SlotExamGroup from '$lib/examGroups/SlotExamGroup.svelte';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	let examGroupsPlannedByMe = [];
	let examGroupsNotPlannedByMe = [];

	$: [examGroupsPlannedByMe, examGroupsNotPlannedByMe] = examGroupsWithoutSlot.reduce(
		(result, element) => {
			result[element.examGroupInfo.notPlannedByMe ? 1 : 0].push(element);
			return result;
		},
		[[], []]
	);

	let showExamGroupsPlannedByMe = true;

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

{#if examGroupsPlannedByMe.length > 0}
	<div class="text-center m-2">
		<div
			class="text-4xl text-center mt-8 uppercase"
			on:click={() => (showExamGroupsPlannedByMe = !showExamGroupsPlannedByMe)}
		>
			{examGroupsPlannedByMe.length} Prüfungsgruppen noch einzuplanen
		</div>
	</div>
	{#if showExamGroupsPlannedByMe}
		<div class="grid  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
			{#each examGroupsPlannedByMe as group}
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

{#if examGroupsNotPlannedByMe.length > 0}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">
			{examGroupsNotPlannedByMe.length} Prüfungsgruppen durch andere einzuplanen
		</div>
	</div>

	<div class="grid  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
		{#each examGroupsNotPlannedByMe as group}
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
				on:rmFromSlot={forwardRmFromSlot}
			/>
		{/each}
	</div>
{/if}
