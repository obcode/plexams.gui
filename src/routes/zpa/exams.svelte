<script>
	import { fade } from 'svelte/transition';
	import { semester } from '../../stores/semester';
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
		<div class="text-center m-2">
			<div class="text-4xl text-center mt-8 uppercase">Prüfungsliste aus dem ZPA</div>
		</div>

		<div class="flex ">
			<input
				class="input input-bordered w-full max-w-x mr-2"
				type="text"
				bind:value={searchTermTeachers}
				placeholder="Dozierender"
			/>

			<input
				class="input input-bordered w-full max-w-x mr-2"
				type="text"
				bind:value={searchTermModule}
				placeholder="Modulname"
			/>
		</div>

		<div class="py-4 grid gap-4 grid-cols-1">
			{#each filteredExams as zpaExamsType}
				{#if zpaExamsType.exams.length > 0}
					<div
						tabindex="0"
						class="collapse collapse-plus border border-base-300 bg-base-100 rounded-box"
					>
						<div class="collapse-title text-xl font-medium">
							<input type="checkbox" checked="" class="checkbox mr-2" />
							{zpaExamsType.type} ({zpaExamsType.exams.length})
						</div>
						<div class="collapse-content">
							<div class="py-4 grid gap-4 md:grid-cols-6 grid-cols-2">
								{#each zpaExamsType.exams as zpaexam}
									<ExamCard exam={zpaexam} />
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="alert alert-info shadow-lg">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-current flex-shrink-0 w-6 h-6"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
				<span>Keine Prüfungen im ZPA für {$semester} gefunden.</span>
			</div>
		</div>
	{/if}
</div>
