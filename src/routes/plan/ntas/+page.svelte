<script>
	export let data;
	import ExamsWithNTAs from '$lib/slot/ExamsWithNTAs.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { onMount } from 'svelte';

	let showOnlyExamsWithNTAs = false;
	let details = false;

	function bg(time) {
		if (time % 2 == 1) {
			return 'bg-slate-200';
		}
		return 'bg-slate-300';
	}

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
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">Details</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						details = !details;
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
		<thead class="border-dashed border-2 border-sky-500 bg-green-400">
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
					<td class="border-dashed border-2 border-sky-500 content-center bg-green-400">
						<div>
							<div>#{time.number}</div>
							<div>{time.start}</div>
						</div>
					</td>
					{#each data.semesterConfig.days as day}
						<td class="align-top border-dashed border-2 border-sky-500 {bg(time.number)}">
							<ExamsWithNTAs
								day={day.number}
								time={time.number}
								{showOnlyExamsWithNTAs}
								{details}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
