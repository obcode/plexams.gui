<script>
	import { onMount } from 'svelte';
	import { ntas, fetchNTAs } from '../../stores/nta';
	import NtaTr from '$lib/NtaTR.svelte';

	onMount(() => {
		fetchNTAs();
	});

	let searchTerm = '';
	let filteredNTAs = [];

	$: {
		if (searchTerm) {
			filteredNTAs = $ntas.filter((nta) =>
				nta.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredNTAs = [...$ntas];
		}
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Studierende mit Nachteilsausgleich</div>
</div>

<div class="flex">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Studierenden"
	/>
</div>

<div class="m-2">
	<div class="overflow-x-auto">
		<table class="table table-zebra w-full">
			<!-- head -->
			<thead>
				<tr>
					<th>Name</th>
					<th>Mtknr</th>
					<th>Ausgleich</th>
					<th>Zeitverlängerung in %</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredNTAs as nta}
					<NtaTr {nta} />
				{/each}
			</tbody>
		</table>
	</div>
</div>
