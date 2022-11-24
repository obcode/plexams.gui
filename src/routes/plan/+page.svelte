<script>
	export let data;
	import Slot from '$lib/Slot.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
</script>

<table
	class="table-fixed border-collapse border-solid border-2 border-sky-500 min-w-full max-w-fit"
>
	<thead class="border-dashed border-2 border-sky-500">
		<tr>
			<th />
			{#each data.semesterConfig.days as day}
				<th class="border-dashed border-2 border-sky-500 object-center">
					<div class="">
						<div>{day.number}</div>
						<div>{mkDateShort(day.date)}</div>
					</div>
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data.semesterConfig.starttimes as time}
			<tr>
				<td class="border-dashed border-2 border-sky-500 content-center">
					<div>
						<div>{time.number}</div>
						<div>{time.start}</div>
					</div>
				</td>
				{#each data.semesterConfig.days as day}
					<td class="border-dashed border-2 border-sky-500">
						<Slot day={day.number} time={time.number} />
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
