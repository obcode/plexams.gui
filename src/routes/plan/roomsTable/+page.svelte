<script>
	export let data;
	import ExamsForRoomPlanning from '$lib/slot/ExamsForRoomPlanning.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { onMount } from 'svelte';

	let showOnlyExamsWithNTAs = false;
	let details = false;

	onMount(() => {});
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Raumplanung</div>
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
		class="table-fixed border-collapse border-solid border-8 border-sky-500 min-w-full max-w-fit"
	>
		<thead class="border-solid border-8 border-sky-500 bg-green-400">
			<tr>
				<th />
				{#each data.semesterConfig.days as day}
					<th class=" border-8 border-sky-500 object-center">
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
					<td class="border-solid border-8 border-sky-500 content-center bg-green-400">
						<div>
							<div>#{time.number}</div>
							<div>{time.start}</div>
						</div>
					</td>
					{#each data.semesterConfig.days as day}
						<td class="align-top border-solid border-8 border-sky-500">
							<ExamsForRoomPlanning
								day={day.number}
								time={time.number}
								{showOnlyExamsWithNTAs}
								{details}
								showRooms="true"
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
