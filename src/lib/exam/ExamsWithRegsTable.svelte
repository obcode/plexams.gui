<script>
	export let exams;

	import { goto } from '$app/navigation';

	let searchTermAncode = '';
	let searchTermTeachers = '';
	let searchTermModule = '';
	let searchTermType = '';
	let searchTermGroups = '';
	let filteredExams = [];

	$: {
		if (searchTermAncode) {
			filteredExams = exams.filter((exam) => exam.ancode.toString().startsWith(searchTermAncode));
		} else if (searchTermTeachers) {
			filteredExams = exams.filter((exam) =>
				exam.zpaExam.mainExamer.toLowerCase().includes(searchTermTeachers.toLowerCase())
			);
		} else if (searchTermModule) {
			filteredExams = exams.filter((exam) =>
				exam.zpaExam.module.toLowerCase().includes(searchTermModule.toLowerCase())
			);
		} else if (searchTermType) {
			filteredExams = exams.filter((exam) =>
				exam.zpaExam.examTypeFull.toLowerCase().includes(searchTermType.toLowerCase())
			);
		} else if (searchTermGroups) {
			filteredExams = exams.filter((exam) => {
				for (let group of exam.zpaExam.groups) {
					if (group.toLowerCase().startsWith(searchTermGroups.toLowerCase())) {
						return true;
					}
				}
				return false;
			});
		} else {
			filteredExams = [...exams];
		}
	}

	function gotoo(ancode) {
		goto(`/exam/examWithRegs/${ancode}`);
	}

	function regs(exam) {
		let sum = 0;
		for (const reg of exam.studentRegs) {
			sum += reg.studentRegs.length;
		}

		return sum;
	}
	function regsP(exam) {
		let programs = '';
		for (const reg of exam.studentRegs) {
			programs = ``;
		}

		return programs;
	}
</script>

<div class="flex ">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermAncode}
		placeholder="AnCode"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermModule}
		placeholder="Modulname"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermTeachers}
		placeholder="Dozierender"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermType}
		placeholder="Art"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermGroups}
		placeholder="Gruppe"
	/>
</div>

<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th>AnCode</th>
				<th>Module</th>
				<th>Prüfer:in</th>
				<th>Art</th>
				<th>Gruppen</th>
				<th>Anmeldungen</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExams as exam}
				<tr>
					<td on:click={gotoo(exam.ancode)}>{exam.ancode}</td>
					<td>{exam.zpaExam.module}</td>
					<td>{exam.zpaExam.mainExamer}</td>
					<td>{exam.zpaExam.examTypeFull}</td>
					<td>{exam.zpaExam.groups}</td>
					<td>
						{#if regs(exam) == 0}
							<div class="badge badge-error gap-2">{regs(exam)}</div>
						{:else}
							<div class="badge badge-success gap-2">&sum; {regs(exam)}</div>
						{/if}
						{#each exam.studentRegs as reg}
							<button class="btn btn-xs p-1 mx-1">
								{reg.program}
								<div class="badge  badge-secondary  badge-xs">{reg.studentRegs.length}</div>
							</button>{/each}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
