<script>
	export let group;

	function bg(notPlannedByMe) {
		if (notPlannedByMe) {
			return 'bg-red-200';
		}
		return '';
	}
</script>

<div class="card lg:card-side bg-base-100 shadow-xl m-3 {bg(group.examGroupInfo.notPlannedByMe)} ">
	<div class="card-body">
		<h2 class="card-title">
			Gruppe {group.examGroupCode} mit {group.examGroupInfo.studentRegs} Anmeldungen aus {group
				.examGroupInfo.programs} und maximaler Dauer von {group.examGroupInfo.maxDuration}
		</h2>
		<ul>
			{#each group.exams as exam}
				<li>
					{exam.exam.ancode}. {exam.exam.zpaExam.mainExamer}: {exam.exam.zpaExam.module}
				</li>
			{/each}
		</ul>
	</div>
</div>
