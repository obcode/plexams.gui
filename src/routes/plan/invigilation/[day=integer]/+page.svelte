<script lang="ts">
	import InvigilatorsForDay from '$lib/invigilator/InvigilatorsForDay.svelte';
	import InvigilationDayPlanning from '$lib/invigilator/InvigilationDayPlanning.svelte';
	import NoSemesterConfig from '$lib/config/NoSemesterConfig.svelte';
	import { mkDate, mkDateShort } from '$lib/jshelper/misc';
	let { data } = $props();

	let selectedInvigilator = $state(0);
	let details = $state(true);

	// absolute Datum/Zeit des angezeigten Tages (für die zeitbasierten Queries)
	const dayDate = $derived(
		data.semesterConfig?.days?.find((d: any) => d.number == data.day)?.date ?? null
	);

	async function handleSelect(detail: { selectedInvigilator: any }) {
		selectedInvigilator = 0;
		selectedInvigilator = detail.selectedInvigilator;
	}

	async function handleUnselect() {
		selectedInvigilator = 0;
	}
</script>

{#if !data.semesterConfig}
	<NoSemesterConfig />
{:else}
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
				onclick={() => {
					details = !details;
				}}
			/>
		</label>
		{#each data.semesterConfig.days as day}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			{#if day.number == data.day}
				<!-- svelte-ignore a11y_missing_attribute -->
				<a data-sveltekit-reload class="tab tab-active" href="./{day.number}">
					{mkDate(day.date)}
				</a>
			{:else}
				<!-- svelte-ignore a11y_missing_attribute -->
				<a data-sveltekit-reload class="tab" href="./{day.number}">
					{mkDateShort(day.date)}
				</a>
			{/if}
		{/each}
	</div>

	<div class="grid grid-cols-12 gap-4">
		<div class="col-span-2">
			<InvigilatorsForDay
				date={dayDate}
				{selectedInvigilator}
				onselected={handleSelect}
				onunselected={handleUnselect}
			/>
		</div>
		<div class="col-span-10">
			<InvigilationDayPlanning
				semesterConfig={data.semesterConfig}
				day={data.day}
				{details}
				{selectedInvigilator}
			/>
		</div>
	</div>
{/if}
