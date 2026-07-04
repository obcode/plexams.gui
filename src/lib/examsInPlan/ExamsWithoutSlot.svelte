<script lang="ts">
	import SlotExam from '$lib/examsInPlan/SlotExam.svelte';

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
		conflictingAncodes,
		onselected,
		onunselected
	} = $props();
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
					onlyConflicts={false}
					{conflictingAncodes}
					{onselected}
					{onunselected}
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
				onlyConflicts={false}
				{conflictingAncodes}
				{onselected}
				{onunselected}
			/>
		{/each}
	</div>
{/if}
