<script>
	export let data;
	import InvigilatorsForDay from '$lib/invigilator/InvigilatorsForDay.svelte';
	import InvigilationDayPlanning from '$lib/invigilator/InvigilationDayPlanning.svelte';
	import { mkDate, mkDateShort } from '$lib/jshelper/misc';

	let details = true;
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Aufsichtenplanung</div>
</div>

<div class="tabs tabs-boxed m-2">
	<label class="label cursor-pointer">
		<span class="label-text">Details</span>
		<input
			type="checkbox"
			checked
			class="toggle mx-3"
			on:click={() => {
				details = !details;
			}}
		/>
	</label>
	{#each data.semesterConfig.days as day}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		{#if day.number == data.day}
			<!-- svelte-ignore a11y-missing-attribute -->
			<a data-sveltekit-reload class="tab tab-active" href="./{day.number}">
				Tag {day.number}: {mkDate(day.date)}
			</a>
		{:else}
			<!-- svelte-ignore a11y-missing-attribute -->
			<a data-sveltekit-reload class="tab" href="./{day.number}">
				Tag {day.number}: {mkDateShort(day.date)}
			</a>
		{/if}
	{/each}
</div>

<div class="grid grid-cols-12 gap-4">
	<div class="col-span-2">
		<InvigilatorsForDay day={data.day} />
	</div>
	<div class="col-span-10">
		<InvigilationDayPlanning semesterConfig={data.semesterConfig} day={data.day} {details} />
	</div>
</div>
