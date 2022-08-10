<script>
	import { fade } from 'svelte/transition';
	import { zpaExams } from '../../stores/zpa';
	import ExamCard from '../../lib/ExamCard.svelte';

	let searchTermTeachers = '';
	let searchTermModule = '';
	let filteredExams = [];

	$: {
		if (searchTermTeachers) {
			filteredExams = $zpaExams.map((examsWithType) => {
				const newEntry = {
					type: examsWithType.type,
					exams: examsWithType.exams.filter((exam) =>
						exam.mainExamer.toLowerCase().includes(searchTermTeachers.toLowerCase())
					)
				};
				return newEntry;
			});
		} else if (searchTermModule) {
			filteredExams = $zpaExams.map((examsWithType) => {
				const newEntry = {
					type: examsWithType.type,
					exams: examsWithType.exams.filter((exam) =>
						exam.module.toLowerCase().includes(searchTermModule.toLowerCase())
					)
				};
				return newEntry;
			});
		} else {
			filteredExams = [...$zpaExams];
		}
	}
</script>

<div transition:fade>
	{#if filteredExams.length > 0}
		<h1 class="text-4xl text-center my-8 uppercase">Prüfungsliste aus dem ZPA</h1>

		<div class="flex ">
			<input
				class="w-full mx-2 rounded-md text-lg p-4 border-2 border-gray-900"
				type="text"
				bind:value={searchTermTeachers}
				placeholder="Dozierender"
			/>

			<input
				class="w-full mx-2 rounded-md text-lg p-4 border-2 border-gray-900"
				type="text"
				bind:value={searchTermModule}
				placeholder="Modulname"
			/>
		</div>

		<div class="py-4 grid gap-4 grid-cols-1">
			{#each filteredExams as zpaExamsType}
				{#if zpaExamsType.exams.length > 0}
					<div class="p-2 bg-gray-200 rounded-md">
						{zpaExamsType.type} ({zpaExamsType.exams.length})
						<div class="py-4 grid gap-4 md:grid-cols-6 grid-cols-2">
							{#each zpaExamsType.exams as zpaexam}
								<ExamCard exam={zpaexam} />
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="bg-blue-500 text-white rounded-md m-10 px-8 py-10 text-center opacity-95">
			keine Prüfungen im ZPA gefunden
		</div>
	{/if}
</div>
