<script>
	export let examsWithoutSlot;
	export let maxSlots;
	export let showExam;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let showOnlySEB;
	export let selectedExam;
	export let selectedExamerID;
	export let onlyPlannedByMe;
	export let details;
	export let moveable;
	export let conflictingAncodes;

	import SlotExam from '$lib/examsInPlan/SlotExam.svelte';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	let examsPlannedByMe = [];
	let examsNotPlannedByMe = [];

	$: [examsPlannedByMe, examsNotPlannedByMe] = examsWithoutSlot.reduce(
		(result, element) => {
			result[element.constraints && element.constraints.notPlannedByMe ? 1 : 0].push(element);
			return result;
		},
		[[], []]
	);

	let showExamsPlannedByMe = true;

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
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="text-4xl text-center mt-8 uppercase"
			on:click={() => (showExamsPlannedByMe = !showExamsPlannedByMe)}
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
