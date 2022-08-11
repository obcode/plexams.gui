<script>
	import { onMount } from 'svelte';
	import ExamCard from '$lib/ExamCard.svelte';
	import { connectedExams, fetchConnectedExams } from '../../stores/exam';

	let loading = false;

	onMount(() => {
		fetchConnectedExams();
	});

	function differentTitles(exam) {
		let diff = false;
		exam.primussExams.forEach((primussExam) => {
			if (primussExam.module != exam.zpaExam.module) {
				diff = true;
			}
		});
		if (diff) {
			return 'bg-red-500';
		}
		return 'bg-green-500';
	}
</script>

{#each $connectedExams as exam}
	<div class="flex justify-items-stretch {differentTitles(exam)}">
		<div class="m-2">
			<ExamCard exam={exam.zpaExam} />
		</div>
		{#each exam.primussExams as primussExam}
			<div class="m-2">
				<ExamCard exam={primussExam} />
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
