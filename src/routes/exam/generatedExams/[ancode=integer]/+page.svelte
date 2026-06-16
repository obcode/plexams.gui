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
							<li>
								{student.name}
								{#if student.zpaStudent}
									({student.zpaStudent.gender}) &lt;{student.zpaStudent.email}&gt;
								{/if}
							</li>
						{/each}
					</ol>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="alert alert-error shadow-lg">
		<div>
			<span class="text-xl">❌</span>
			<span>Prüfung nicht in Planung.</span>
		</div>
	</div>
{/if}
