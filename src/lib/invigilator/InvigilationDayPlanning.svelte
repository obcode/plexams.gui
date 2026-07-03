<script lang="ts">
	import InvigilationSlotPlanning from './InvigilationSlotPlanning.svelte';

	let {
		semesterConfig,
		day,
		details,
		selectedInvigilator
	}: {
		semesterConfig: { starttimes: any[] };
		day: any;
		details: boolean;
		selectedInvigilator: any;
	} = $props();
</script>

{#each semesterConfig.starttimes as time}
	<InvigilationSlotPlanning {day} {time} {details} {selectedInvigilator} />
{/each}
