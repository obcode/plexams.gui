<script>
	export let semesterConfig;
	export let day;

	import InvigilationSlotPlanning from './InvigilationSlotPlanning.svelte';
</script>

{#each semesterConfig.starttimes as time}
	<InvigilationSlotPlanning {semesterConfig} {day} {time} />
{/each}
