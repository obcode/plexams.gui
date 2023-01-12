<script>
	export let data;
	import InvigilatorsDay from '$lib/invigilator/InvigilatorsDay.svelte';
	import InvigilationDayPlanning from '$lib/invigilator/InvigilationDayPlanning.svelte';
	import { mkDate, mkDateShort } from '$lib/jshelper/misc';
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Aufsichtenplanung</div>
</div>

<div class="tabs tabs-boxed  m-2">
	{#each data.semesterConfig.days as day}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		{#if day.number == data.day}
			<!-- svelte-ignore a11y-missing-attribute -->
			<a data-sveltekit-reload class="tab  tab-active" href="./{day.number}"
				>Tag {day.number}: {mkDate(day.date)}</a
			>
		{:else}
			<!-- svelte-ignore a11y-missing-attribute -->
			<a data-sveltekit-reload class="tab" href="./{day.number}"
				>Tag {day.number}: {mkDateShort(day.date)}</a
			>
		{/if}
	{/each}
</div>

<div class="grid grid-cols-12 gap-4">
	<div class="col-span-2">
		<InvigilatorsDay semesterConfig={data.semesterConfig} day={data.day} />
	</div>
	<div class="col-span-10">
		<InvigilationDayPlanning semesterConfig={data.semesterConfig} day={data.day} />
	</div>
</div>
