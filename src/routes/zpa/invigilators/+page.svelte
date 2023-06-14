<script>
	export let data;
	let invigilators = data.invigilators;
	import Invigilators from '$lib/zpa/Invigilators.svelte';

	let searchTerm = '';
	let filteredTeacher = [];

	let invigsWithoutReqs = invigilators.filter((invig) => !invig.hasSubmittedRequirements);

	$: {
		if (searchTerm) {
			filteredTeacher = invigilators.filter((invig) =>
				invig.teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredTeacher = [...invigilators];
		}
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		Aufsichten
		<span class="badge badge-lg indicator-item">{invigilators.length}</span>
		{#if 0 < invigsWithoutReqs.length}
			--- es fehlen noch {invigsWithoutReqs.length} Anforderungen
		{/if}
	</div>
</div>

<div class="flex">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Aufsichten"
	/>
</div>

<Invigilators invigilators={filteredTeacher} />
