<script>
	export let data;
	import { mkDateShort } from '$lib/jshelper/misc';
	import { fade } from 'svelte/transition';

	import InvigilatorTR from '$lib/invigilator/InvigilatorTR.svelte';

	let invigilators = data.todos.invigilators;
	const todos = data.todos;

	let searchTerm = '';
	let filteredInvigilators = [];

	let sortOpen = true;

	let stillOpen = 0;
	for (const invig of data.todos.invigilators) {
		stillOpen += invig.todos.totalMinutes - invig.todos.doingMinutes;
	}

	const stillOpenPerInvig = Math.round(stillOpen / data.todos.invigilators.length);

	$: {
		let filteredInvigilatorsTmp = [];
		filteredInvigilators = filteredInvigilatorsTmp;
		if (searchTerm) {
			filteredInvigilatorsTmp = invigilators.filter((invig) =>
				invig.teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredInvigilatorsTmp = [...invigilators];
		}
		if (sortOpen) {
			filteredInvigilatorsTmp.sort((a, b) => {
				const x = a.todos.totalMinutes - a.todos.doingMinutes;
				const y = b.todos.totalMinutes - b.todos.doingMinutes;
				if (x < y) {
					return 1;
				}
				if (x > y) {
					return -1;
				}
				return 0;
			});
		}
		filteredInvigilators = filteredInvigilatorsTmp;
	}
</script>

<div class="flex flex-col m-2">
	<div>
		<div class="text-4xl text-center mt-8 uppercase">
			Aufsichten mit Anforderungen
			<span class="badge badge-lg indicator-item">{invigilators.length}</span>
		</div>
	</div>

	<div class="text-center stats shadow justify-center">
		<div class="stat place-items-center">
			<div class="stat-title">Aufsichten in Räumen</div>
			<div class="stat-value">{todos.sumExamRooms} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">Reserve-Aufsichten</div>
			<div class="stat-value">{todos.sumReserve} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">anrechenbare Zeiten</div>
			<div class="stat-value">{todos.sumOtherContributions} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">anrechenbare Zeiten (bereinigt)</div>
			<div class="stat-value">{todos.sumOtherContributionsOvertimeCutted} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">zu leisten pro Aufsicht</div>
			<div class="stat-value">{todos.todoPerInvigilator} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">zu leisten pro Aufsicht (bereinigt)</div>
			<div class="stat-value">{todos.todoPerInvigilatorOvertimeCutted} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">Summe noch offen</div>
			<div class="stat-value">{stillOpen} Min.</div>
		</div>

		<div class="stat place-items-center">
			<div class="stat-title">Summe noch offen pro Aufsicht</div>
			<div class="stat-value">{stillOpenPerInvig} Min.</div>
		</div>
	</div>
</div>

<div class="flex justify-center">
	{#each data.semesterConfig.days as day}
		<div class="btn-group">
			<button class="btn btn-outline gap-2 m-1">
				Tag {day.number}
				<div class="badge badge-warning">{mkDateShort(day.date)}</div>
			</button>
		</div>
	{/each}
</div>

<div class="flex my-2">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Aufsichten"
	/>
	<div class="form-control m-3">
		<label class="label cursor-pointer">
			<span class="label-text">Alphabetisch</span>
			<input
				type="checkbox"
				class="toggle mx-3"
				on:click={() => {
					sortOpen = !sortOpen;
				}}
			/>
		</label>
	</div>
</div>

{#key filteredInvigilators}
	<div class="overflow-x-auto" transition:fade>
		<table class="table table-compact w-full">
			<thead>
				<tr>
					<th />
					<th>Name</th>
					<th>Tage</th>
					<th>Faktor</th>
					<th>anrechenbar</th>
					<th>zu leisten</th>
					<th>geleistet</th>
					<th>noch offen</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredInvigilators as invigilator, index}
					<InvigilatorTR semesterConfig={data.semesterConfig} {index} {invigilator} />
				{/each}
			</tbody>
		</table>
	</div>
{/key}
