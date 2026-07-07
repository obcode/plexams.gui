<script lang="ts">
	import InvigilationSlotPlanning from './InvigilationSlotPlanning.svelte';
	import { combineStarttime } from '$lib/exam/setExamTime';

	let {
		semesterConfig,
		day,
		details,
		selectedInvigilator
	}: {
		semesterConfig: { days: any[]; starttimes: any[] };
		day: any;
		details: boolean;
		selectedInvigilator: any;
	} = $props();

	// day ist die Tagesnummer; die absolute Startzeit je Slot brauchen wir für die
	// zeitbasierten Queries (roomsWithInvigilationsAt).
	const dayDate = $derived(semesterConfig.days?.find((d: any) => d.number == day)?.date ?? null);
</script>

{#each semesterConfig.starttimes as time}
	<InvigilationSlotPlanning
		{time}
		starttime={combineStarttime(dayDate, time.start, dayDate)}
		{details}
		{selectedInvigilator}
	/>
{/each}
