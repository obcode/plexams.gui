<script lang="ts">
	import ExamWithNTAsForRoomPlanning from '$lib/exam/ExamWithNTAsForRoomPlanning.svelte';
	import { onMount } from 'svelte';
	import { errorMessage, postApi } from '$lib/apiClient';

	let {
		day,
		time,
		starttime,
		showOnlyExamsWithNTAs,
		details,
		showRooms,
		dimOthers = false,
		showOnlyWithoutRoom = false,
		highlightNotPrePlanned = false,
		// fix vorgeplante Platzzahlen je „ancode|raum|mtknr"
		prePlannedSeats = {},
		// Ancodes mit nicht zugeordneten Studierenden
		unplacedAncodes = new Set()
	}: {
		day: number;
		time: number;
		starttime: string;
		showOnlyExamsWithNTAs: boolean;
		details: boolean;
		showRooms: any;
		dimOthers?: boolean;
		showOnlyWithoutRoom?: boolean;
		highlightNotPrePlanned?: boolean;
		prePlannedSeats?: Record<string, number>;
		unplacedAncodes?: Set<number>;
	} = $props();

	let examsInSlot = $state<any[]>([]);

	let loadError = $state('');

	async function fetchExamsInSlot() {
		try {
			const data = await postApi('/api/slot/examsAt', { starttime });
			examsInSlot = data.examsAt ?? [];
			loadError = '';
		} catch (e) {
			examsInSlot = [];
			loadError = errorMessage(e);
		}
	}

	onMount(() => {
		fetchExamsInSlot();
	});
</script>

{#if loadError}
	<div class="m-1 text-xs text-error">Prüfungen nicht ladbar: {loadError}</div>
{/if}

{#each examsInSlot as plannedExam}
	{#if !plannedExam.constraints || !plannedExam.constraints.notPlannedByMe}
		<ExamWithNTAsForRoomPlanning
			{plannedExam}
			{showOnlyExamsWithNTAs}
			{details}
			{showRooms}
			{dimOthers}
			{day}
			{time}
			{starttime}
			{showOnlyWithoutRoom}
			{highlightNotPrePlanned}
			{prePlannedSeats}
			{unplacedAncodes}
		/>
	{/if}
{/each}
