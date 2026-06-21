<script>
	export let data;
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { fade } from 'svelte/transition';
	import { request, gql } from 'graphql-request';
	import { goto } from '$app/navigation';
	import ExamTypeCard from '$lib/exam/ExamTypeCard.svelte';

	let zpaExams = data.zpaExamsByType;

	let zpaExamsToPlan = [];
	async function getZpaExamsToPlan() {
		const response = await fetch('/api/zpaexams/toplan', { method: 'GET' });
		zpaExamsToPlan = await response.json();
	}
	onMount(getZpaExamsToPlan);

	/** @type {Set<number>} */
	const selectedAncodes = new Set();
	let size = selectedAncodes.size;

	/** @param {any} event */
	function handleSelect(event) {
		selectedAncodes.add(event.detail.ancode);
		size = selectedAncodes.size;
	}
	/** @param {any} event */
	function handleUnselect(event) {
		selectedAncodes.delete(event.detail.ancode);
		size = selectedAncodes.size;
	}

	function setSelectedZpaExams() {
		const mutation = gql`
			mutation ($input: [Int!]!) {
				zpaExamsToPlan(input: $input) {
					ancode
					module
					mainExamer
					examType
					groups
				}
			}
		`;
		const variables = { input: Array.from(selectedAncodes) };
		request(env.PUBLIC_PLEXAMS_SERVER, mutation, variables).then(() => {
			goto('/exam/examsToPlan');
		});
	}

	let searchTermTeachers = '';
	let searchTermModule = '';
	/** @type {any[]} */
	let filteredExams = [];

	$: {
		if (searchTermTeachers) {
			filteredExams = zpaExams.map((/** @type {any} */ examsWithType) => ({
				type: examsWithType.type,
				exams: examsWithType.exams.filter((/** @type {any} */ exam) =>
					exam.mainExamer.toLowerCase().includes(searchTermTeachers.toLowerCase())
				)
			}));
		} else if (searchTermModule) {
			filteredExams = zpaExams.map((/** @type {any} */ examsWithType) => ({
				type: examsWithType.type,
				exams: examsWithType.exams.filter((/** @type {any} */ exam) =>
					exam.module.toLowerCase().includes(searchTermModule.toLowerCase())
				)
			}));
		} else {
			filteredExams = [...zpaExams];
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4" transition:fade>
	{#if zpaExamsToPlan.length > 0}
		<a href="/exam/examsToPlan" class="alert alert-warning text-sm">
			<span>
				⚠️ Es wurden bereits {zpaExamsToPlan.length} Prüfungen für die Planung ausgewählt. Du kannst
				nur noch einzelne Prüfungen hinzufügen und entfernen. Durch Löschen der Collections in der DB
				kommst du zur Einteilung hier zurück.
			</span>
		</a>
	{:else if filteredExams.length > 0}
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold">Prüfungsliste aus dem ZPA</h1>
			{#if size > 0}
				<span class="badge badge-success badge-lg tabular-nums">{size} ausgewählt</span>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
			<input
				class="input input-bordered input-sm flex-1"
				type="text"
				bind:value={searchTermTeachers}
				placeholder="Dozierende:r"
			/>
			<input
				class="input input-bordered input-sm flex-1"
				type="text"
				bind:value={searchTermModule}
				placeholder="Modulname"
			/>
		</div>

		<div class="flex flex-col gap-3">
			{#each filteredExams as zpaExamsType}
				{#if zpaExamsType.exams.length > 0}
					<ExamTypeCard {zpaExamsType} on:selected={handleSelect} on:unselected={handleUnselect} />
				{/if}
			{/each}
		</div>

		{#if zpaExamsToPlan.length == 0}
			<div
				class="sticky bottom-2 flex items-center justify-end gap-3 rounded-lg border border-base-300 bg-base-100/90 p-3 backdrop-blur"
			>
				<span class="text-sm text-base-content/60">{size} ausgewählt</span>
				<button class="btn btn-primary btn-sm" disabled={size === 0} on:click={setSelectedZpaExams}>
					Auswahl für die Planung übernehmen
				</button>
			</div>
		{/if}
	{:else}
		<div class="alert alert-info">
			<span>ℹ️ Keine Prüfungen im ZPA für das ausgewählte Semester gefunden.</span>
		</div>
	{/if}
</div>
