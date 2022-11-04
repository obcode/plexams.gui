<script>
	import { onMount } from 'svelte';
	import ExamCard from '$lib/ExamCard.svelte';
	import PrimussExamCard from '$lib/PrimussExamCard.svelte';
	import { connectedExams, fetchConnectedExams } from '../../../stores/exam';

	let fk07programs = 'unknown';
	async function getFk07programs() {
		const response = await fetch('/api/fk07programs', {
			method: 'GET'
		});

		fk07programs = await response.json();
	}

	onMount(() => {
		getFk07programs();
		fetchConnectedExams();
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
		if (diffModule && diffMainExamer) {
			return 'bg-red-500';
		}
		return 'bg-green-500';
	}

	let toRemove = [];

	function toggleToRemove(primussExam) {
		if (toRemove.includes((primussExam.anCode, primussExam.program))) {
			if (Array.isArray(toRemove)) {
				toRemove = toRemove.filter(
					(entry) => !(entry == (primussExam.anCode, primussExam.program))
				);
			}
		} else {
			toRemove = (primussExam.anCode, primussExam.program) + toRemove;
		}
	}

	function removeExam(event) {
		toRemove = [event.detail, ...toRemove];
	}

	function doNotRemoveExam(event) {
		if (Array.isArray(toRemove)) {
			toRemove = toRemove.filter(
				(entry) => !(entry.anCode == event.detail.anCode && entry.program == event.detail.program)
			);
		}
	}
</script>

{#each $connectedExams as exam}
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
					fk07programs
					on:removeMe={removeExam}
					on:doNotRemoveMe={doNotRemoveExam}
				/>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex items-center justify-center h-screen">
		<div
			style="border-top-color:transparent"
			class="w-16 h-16 border-4 border-red-400 border-solid rounded-full animate-spin"
		/>
	</div>
{/each}
