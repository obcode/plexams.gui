<script>
	export let semesterConfig;
	export let day;
	export let details;
	export let selectedInvigilator;

	import InvigilationSlotPlanning from './InvigilationSlotPlanning.svelte';
</script>

{#each semesterConfig.starttimes as time}
	<InvigilationSlotPlanning {day} {time} {details} {selectedInvigilator} />
{/each}
