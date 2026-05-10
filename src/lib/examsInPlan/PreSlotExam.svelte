<script>
	export let exam;
	import { mkStarttime } from '$lib/jshelper/misc';

	let bg = 'bg-cyan-200';
	if (exam.zpaExam.isRepeaterExam) {
		bg = 'bg-red-200';
	}
	if (exam.constraints && exam.constraints.notPlannedByMe) {
		bg = 'bg-gray-200';
	}
	console.log(exam.planEntry.externalTime);
</script>

{#if exam}
	<div class="shadow-lg m-1 p-2 border-2 rounded-lg shadow-slate-300 {bg}">
		{#if exam.planEntry.externalTime != null}
			<div class="badge bg-red-300">{mkStarttime(exam.planEntry.externalTime)}</div>
		{/if}
		<div class="grow">
			{exam.zpaExam.ancode}.
			{exam.zpaExam.module}
			({exam.zpaExam.mainExamer})
		</div>
		{#each exam.zpaExam.primussAncodes as primuss}
			<div class="badge bg-green-500 text-white rounded-full px-2 py-1 text-xs">
				{primuss.program}
			</div>
		{/each}
		{#if exam.constraints && exam.constraints.roomConstraints}
			<div>
				{#if exam.constraints.roomConstraints.maxStudents}
					<div class="badge bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
						{Math.ceil(exam.constraints.roomConstraints.maxStudents / 30)} ({exam.constraints
							.roomConstraints.maxStudents})
					</div>
				{/if}
				<br />
				{#if exam.constraints.roomConstraints.comments}
					<div class="badge bg-yellow-500 text-white rounded-full px-2 py-1 text-xs">
						{exam.constraints.roomConstraints.comments}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
