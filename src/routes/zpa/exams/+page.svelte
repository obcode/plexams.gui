<script>
	import { env } from '$env/dynamic/public';
	import { fade } from 'svelte/transition';
	import { request, gql } from 'graphql-request';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { zpaExamsToPlan, fetchZPAExamsToPlan } from '../../../stores/zpa';
	import { semester } from '../../../stores/semester';
	import { zpaExams } from '../../../stores/zpa';
	import ExamTypeCard from '../../../lib/ExamTypeCard.svelte';

	onMount(() => {
		fetchZPAExamsToPlan();
	});

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

		request(env.PUBLIC_PLEXAMS_SERVER, mutation, variables).then((data) => {
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
	{#if $zpaExamsToPlan.length > 0}
		<a href="/exam/examsToPlan">
			<div class="alert alert-warning shadow-lg m-2">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current flex-shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/></svg
					>
					<span
						>Es wurden bereits {$zpaExamsToPlan.length} Prüfungen für die Planung ausgewählt. Sie können
						nur noch einzelne Prüfungen hinzufügen und entfernen. Durch Löschen der Collections in der
						DB können Sie zur Einteilung hier zurück gehen.</span
					>
				</div>
			</div></a
		>
	{:else if filteredExams.length > 0}
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
		{#if $zpaExamsToPlan.length == 0}
			<div class="text-center m-2 text-4xl">
				<button class="btn btn-lg" on:click={setSelectedZpaExams}
					>{size} ausgewählte ZPA-Prüfungen für die Planung übernehmen</button
				>
			</div>
		{/if}
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
