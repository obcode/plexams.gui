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
	<button
		type="button"
		class="mx-1 mt-6 mb-2 flex items-center gap-2 text-left"
		onclick={() => (showExamsPlannedByMe = !showExamsPlannedByMe)}
	>
		<span class="text-base-content/50">{showExamsPlannedByMe ? '▾' : '▸'}</span>
		<h2 class="text-xl font-semibold">Noch einzuplanen</h2>
		<span class="badge badge-warning badge-sm tabular-nums">{examsPlannedByMe.length}</span>
	</button>
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
	<h2 class="mx-1 mt-6 mb-2 text-xl font-semibold">💪 Alles geplant</h2>
{/if}

{#if !onlyPlannedByMe && examsNotPlannedByMe.length > 0}
	<div class="mx-1 mt-6 mb-2 flex items-center gap-2">
		<h2 class="text-xl font-semibold">Nicht durch mich einzuplanen</h2>
		<span class="badge badge-ghost badge-sm tabular-nums">{examsNotPlannedByMe.length}</span>
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
