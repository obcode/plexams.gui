<script>
	export let data;
	import { onMount } from 'svelte';
	import ExamCard from '$lib/exam/ExamCard.svelte';
	import PrimussExamCard from '$lib/PrimussExamCard.svelte';

	let fk07programs = [];
	async function getFk07programs() {
		const response = await fetch('/api/fk07programs', {
			method: 'GET'
		});

		fk07programs = await response.json();
	}

	onMount(() => {
		getFk07programs();
	});

	function differentTitlesOrMainExamer(exam) {
		let diffModule = false;
		let diffMainExamer = false;
		exam.primussExams.forEach((primussExam) => {
			if (primussExam.module !== exam.zpaExam.module) {
				diffModule = true;
			}
			if (primussExam.mainExamer !== exam.zpaExam.mainExamer.replace(',', '')) {
				diffMainExamer = true;
			}
		});
		if ((diffModule && diffMainExamer) || (exam.errors && exam.errors.length > 0)) {
			return 'bg-red-500';
		}
		return 'bg-green-500';
	}

	let toRemove = [];

	function toggleToRemove(primussExam) {
		if (toRemove.includes((primussExam.ancode, primussExam.program))) {
			if (Array.isArray(toRemove)) {
				toRemove = toRemove.filter(
					(entry) => !(entry == (primussExam.ancode, primussExam.program))
				);
			}
		} else {
			toRemove = (primussExam.ancode, primussExam.program) + toRemove;
		}
	}

	function removeExam(event) {
		toRemove = [event.detail, ...toRemove];
	}

	function doNotRemoveExam(event) {
		if (Array.isArray(toRemove)) {
			toRemove = toRemove.filter(
				(entry) => !(entry.ancode == event.detail.ancode && entry.program == event.detail.program)
			);
		}
	}
</script>

{#each data.connectedExams as exam}
	<div class="flex justify-items-stretch {differentTitlesOrMainExamer(exam)}">
		<div class="m-2">
			<ExamCard exam={exam.zpaExam} />
		</div>
		{#each exam.primussExams as primussExam}
			<div
				class="m-2"
				onClick={() => {
					console.log('FIXME');
					// toggleToRemove(primussExam);
				}}
			>
				<PrimussExamCard
					exam={primussExam}
					{fk07programs}
					on:removeMe={removeExam}
					on:doNotRemoveMe={doNotRemoveExam}
				/>
			</div>
		{/each}
		{#if exam.errors && exam.errors.length > 0}
			<div class="m-2 p-10 bg-yellow-500">
				<ul class="list-disc">
					{#each exam.errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center h-screen">
		<div
			style="border-top-color:transparent"
			class="w-16 h-16 border-4 border-red-400 border-solid rounded-full animate-spin"
		/>
	</div>
{/each}
