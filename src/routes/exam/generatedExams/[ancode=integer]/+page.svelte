<script>
	export let data;
	let exam;
	let programs;
	let studentCount;
	let gridparams;

	if (data.generatedExam) {
		exam = data.generatedExam;
		programs = exam.primussExams.length;
		gridparams = `grid-cols-${programs} gap-${programs}`;
		studentCount = exam.primussExams.reduce(
			(sum, primussExam) => sum + primussExam.studentRegs.length,
			0
		);
	}
</script>

{#if data.generatedExam}
	<div class="text-center m-2 text-4xl">
		<span class="uppercase">{exam.ancode}. {exam.zpaExam.mainExamer}, {exam.zpaExam.module}</span>
	</div>

	<div class="text-center m-2 text-2xl">
		<span class="uppercase">{studentCount} Anmeldungen</span>
	</div>

	<div class="grid {gridparams}">
		{#each exam.primussExams as primussExam}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">{primussExam.exam.program}</h2>
					<ol class="list-inside list-decimal">
						{#each primussExam.studentRegs as student}
							<li>{student.name}</li>
						{/each}
					</ol>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="alert alert-error shadow-lg">
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
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<span>Prüfung nicht in Planung.</span>
		</div>
	</div>
{/if}
