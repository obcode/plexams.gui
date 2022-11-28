<script>
	export let day;
	export let time;
	export let maxSlots;
	export let selectedGroup;
	export let details;
	export let moveable;
	export let showGroup;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let conflictingGroupCodes;
	export let refresh;
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import { onMount } from 'svelte';

	import SlotExamGroup from '$lib/SlotExamGroup.svelte';

	let examGroups = [];

	async function fetchExamGroups() {
		const response = await fetch('/api/examGroupsInSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		examGroups = data.examGroupsInSlot;
		countIt();
	}

	let count = 0;

	function countIt() {
		let counted = 0;
		for (const group of examGroups) {
			counted += group.examGroupInfo.studentRegs;
		}
		count = counted;
	}

	function badgeColor(count) {
		if (count < 50) {
			return 'badge-success';
		}
		if (count < 100) {
			return 'badge-warning';
		}
		return 'badge-error';
	}

	onMount(() => {
		fetchExamGroups();
	});

	function forwardSelected(event) {
		dispatch('selected', event.detail);
	}
	function forwardUnselected(event) {
		dispatch('unselected', event.detail);
	}
	function forwardAddToSlot(event) {
		dispatch('addToSlot', {
			examGroupCode: event.detail.examGroupCode,
			slot: event.detail.slot,
			oldslot: { dayNumber: day, slotNumber: time }
		});
	}

	$: if (refresh) {
		fetchExamGroups();
		refresh = false;
	}
</script>

{#if examGroups.length > 0}
	<div class="flex justify-end">
		<div class="badge {badgeColor(count)} gap-2 m-1">{count}</div>
	</div>
{/if}

{#each examGroups as group}
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
		inSlot={true}
		{conflictingGroupCodes}
		on:selected={forwardSelected}
		on:unselected={forwardUnselected}
		on:addToSlot={forwardAddToSlot}
	/>
{/each}
