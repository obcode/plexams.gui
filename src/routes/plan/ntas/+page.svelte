<script>
	export let data;
	import ExamsWithNTAs from '$lib/slot/ExamsWithNTAs.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { onMount } from 'svelte';

	let showOnlyExamsWithNTAs = false;

	onMount(() => {});
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Prüfungsplan (Prüfungen mit NTAs)</div>
</div>

<div class="flex">
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">Nur Prüfungen mit NTAs</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						showOnlyExamsWithNTAs = !showOnlyExamsWithNTAs;
					}}
				/>
			</label>
		</div>
	</div>
</div>
<div>
	<table
		class="table-fixed border-collapse border-solid border-2 border-sky-500 min-w-full max-w-fit"
	>
		<thead class="border-dashed border-2 border-sky-500">
			<tr>
				<th />
				{#each data.semesterConfig.days as day}
					<th class="border-dashed border-2 border-sky-500 object-center">
						<div class="">
							<div>#{day.number}</div>
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
							<div>#{time.number}</div>
							<div>{time.start}</div>
						</div>
					</td>
					{#each data.semesterConfig.days as day}
						<td class="border-dashed border-2 border-sky-500">
							<ExamsWithNTAs day={day.number} time={time.number} {showOnlyExamsWithNTAs} />
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
