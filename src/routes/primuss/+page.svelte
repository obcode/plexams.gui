<script>
	export let data;
</script>

<h1 class="text-4xl text-center my-8 uppercase">Prüfungsliste aus Primuss</h1>

<ul>
	{#each data.primussExams as primussExam}
		<li>
			{primussExam.program} ({primussExam.exams.length})
			<ul>
				{#each primussExam.exams as exam}
					<li>
						{exam.anCode}.
						{exam.module},
						<i>{exam.mainExamer}</i>
						({exam.studentRegs.length} Anmeldungen, {exam.conflicts.conflicts.length} Konflikte)
					</li>
				{/each}
			</ul>
		</li>
	{:else}
		<h3>keine Prüfungen von Primuss gefunden</h3>
	{/each}
</ul>
