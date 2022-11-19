<script>
	export let group;

	function bg(notPlannedByMe) {
		if (notPlannedByMe) {
			return 'bg-red-200';
		}
		return '';
	}

	function regs(exam) {
		let sum = 0;
		for (const reg of exam.studentRegs) {
			sum += reg.studentRegs.length;
		}

		return sum;
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
					<div class="badge badge-success gap-2">{regs(exam.exam)}</div>
				</li>
			{/each}
		</ul>
		<div class="card-actions justify-end">
			Anmeldungen:
			<button class="btn btn-primary">&sum; {group.examGroupInfo.studentRegs}</button>
		</div>
	</div>
</div>
