<script>
	export let data;

	// import { semester } from '../../../stores/semester.js';
	import NtaTr from '$lib/nta/NtaTR.svelte';

	let searchTerm = '';
	let filteredNTAs = [];

	let roomAlone = false;
	let currentSemester = false;

	$: {
		if (searchTerm) {
			filteredNTAs = data.ntas.filter((nta) =>
				nta.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else if (roomAlone) {
			filteredNTAs = data.ntas.filter((nta) => nta.needsRoomAlone);
		} else if (currentSemester) {
			filteredNTAs = data.ntas.filter((nta) => nta.lastSemester == data.semester);
		} else {
			filteredNTAs = [...data.ntas];
		}
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{data.ntas.length} Studierende mit Nachteilsausgleich
	</div>
</div>

<div class="flex">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Studierenden"
	/>
	<div class="form-control">
		<label class="label cursor-pointer">
			<span class="label-text">Anmeldungen im aktuellen Semester</span>
			<input type="checkbox" bind:checked={currentSemester} class="checkbox" />
		</label>
	</div>
	<div class="form-control">
		<label class="label cursor-pointer">
			<span class="label-text">Alle mit eigenem Raum</span>
			<input type="checkbox" bind:checked={roomAlone} class="checkbox" />
		</label>
	</div>
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
					<th>gültig bis</th>
					<th>zuletzt</th>
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
