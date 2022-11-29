<script>
	export let data;
	let invigilators = data.invigilators;
	import Teachers from '$lib/zpa/Teachers.svelte';

	let searchTerm = '';
	let filteredTeacher = [];

	$: {
		if (searchTerm) {
			filteredTeacher = invigilators.filter((teacher) =>
				teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
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

<Teachers teachers={filteredTeacher} />
