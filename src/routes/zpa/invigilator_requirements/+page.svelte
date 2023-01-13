<script>
	export let data;
	import InvigilatorTR from '$lib/invigilator/InvigilatorTR.svelte';

	let invigilators = data.todos.invigilators;
	const todos = data.todos;

	let searchTerm = '';
	let filteredInvigilators = [];

	$: {
		if (searchTerm) {
			filteredInvigilators = invigilators.filter((invig) =>
				invig.teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredInvigilators = [...invigilators];
		}
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
	</div>
</div>

<div class="flex my-2">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Aufsichten"
	/>
</div>

<div class="overflow-x-auto">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th />
				<th>Name</th>
				<th>Tage</th>
				<th>Faktor</th>
				<th>anrechenbar</th>
				<th>zu leisten</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredInvigilators as invigilator, index}
				<InvigilatorTR {index} {invigilator} />
			{/each}
		</tbody>
	</table>
</div>
