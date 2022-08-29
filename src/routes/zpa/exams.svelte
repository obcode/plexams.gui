<script>
	import { fade } from 'svelte/transition';
	import { request, gql } from 'graphql-request';
	import { goto } from '$app/navigation';

	import { semester } from '../../stores/semester';
	import { zpaExams } from '../../stores/zpa';
	import ExamTypeCard from '../../lib/ExamTypeCard.svelte';

	const selectedAncodes = new Set([]);
	let size = selectedAncodes.size;

	function handleSelect(event) {
		selectedAncodes.add(event.detail.anCode);
		size = selectedAncodes.size;
	}
	function handleUnselect(event) {
		selectedAncodes.delete(event.detail.anCode);
		size = selectedAncodes.size;
	}

	function setSelectedZpaExams() {
		const mutation = gql`
			mutation ($input: [Int!]!) {
				zpaExamsToPlan(input: $input) {
					anCode
					module
					mainExamer
					examType
					groups
				}
			}
		`;

		const variables = {
			input: Array.from(selectedAncodes)
		};

		request('http://localhost:8080/query', mutation, variables).then((data) => {
			goto('/exam/examsToPlan');
		});
	}

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
		<div class="text-center m-2 text-4xl">
			<span class="uppercase">Prüfungsliste aus dem ZPA</span>
			{#if size > 0}
				<span class="badge badge-success badge-lg">{size} ausgewählt</span>
			{/if}
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
					<ExamTypeCard {zpaExamsType} on:selected={handleSelect} on:unselected={handleUnselect} />
				{/if}
			{/each}
		</div>
		<div class="text-center m-2 text-4xl">
			<button class="btn btn-lg" on:click={setSelectedZpaExams}
				>{size} ausgewählte ZPA-Prüfungen für die Planung übernehmen</button
			>
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
