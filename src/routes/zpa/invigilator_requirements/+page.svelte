<script>
	export let data;
	import InvigilatorTR from '$lib/invigilator/InvigilatorTR.svelte';

	let invigilators = data.invigilatorsWithReq;

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

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		Aufsichten mit Anforderungen
		<span class="badge badge-lg indicator-item">{invigilators.length}</span>
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
	<table class="table table-zebra table-compact w-full">
		<thead>
			<tr>
				<th />
				<th>Name</th>
				<th>Faktor</th>
				<th>anrechenbar</th>
				<th>Prüfungstage</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredInvigilators as invigilator, index}
				<InvigilatorTR {index} {invigilator} />
			{/each}
		</tbody>
	</table>
</div>
